-- Limites contra abuso no checkout e na troca. Sem eles, um script reserva todo o estoque
-- com pedidos falsos. Ficam no banco porque a chave anon é pública: um limite só no site
-- seria contornado chamando a API do Supabase direto.

create table public.rate_limit_hits (
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_key_idx on public.rate_limit_hits (key, created_at);
create index rate_limit_hits_created_idx on public.rate_limit_hits (created_at);
alter table public.rate_limit_hits enable row level security; -- sem políticas: só as funções abaixo acessam

create index orders_open_phone_idx on public.orders (customer_phone)
  where status in ('pending', 'awaiting_payment');

-- Registra uma tentativa e recusa acima de p_max dentro de p_window (no máximo 1 dia).
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window interval)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from public.rate_limit_hits where created_at < now() - interval '1 day';
  if (select count(*) from public.rate_limit_hits where key = p_key and created_at > now() - p_window) >= p_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.rate_limit_hits (key) values (p_key);
end;
$$;
revoke execute on function public.hit_rate_limit(text, int, interval) from public, anon, authenticated;

-- IPv6 vira o /64: um único cliente costuma ter o bloco inteiro e trocaria de endereço à vontade.
create or replace function public.ip_bucket(ip text)
returns text
language plpgsql
immutable
as $$
begin
  return case when family(ip::inet) = 6 then network(set_masklen(ip::inet, 64))::text else host(ip::inet) end;
exception when others then
  return null;
end;
$$;
revoke execute on function public.ip_bucket(text) from public, anon, authenticated;

-- O site chama estas versões com a chave de serviço, informando o IP real do cliente.
-- Tentativas recusadas pela validação do pedido não contam (a transação inteira é desfeita).
create or replace function public.place_order_limited(payload jsonb, client_ip text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.ip_bucket(client_ip);
  v_phone text := regexp_replace(coalesce(payload -> 'customer' ->> 'phone', ''), '\D', '', 'g');
begin
  if v_ip is not null then
    perform public.hit_rate_limit('order:ip:' || v_ip, 5, interval '1 hour');
  end if;
  perform public.release_expired_orders();
  perform pg_advisory_xact_lock(hashtext('order:phone:' || v_phone));
  if (select count(*) from public.orders
      where customer_phone = v_phone and status in ('pending', 'awaiting_payment')) >= 2 then
    raise exception 'too_many_open_orders' using errcode = 'P0001';
  end if;
  return public.place_order(payload);
end;
$$;
revoke execute on function public.place_order_limited(jsonb, text) from public, anon, authenticated;
grant execute on function public.place_order_limited(jsonb, text) to service_role;

create or replace function public.submit_trade_in_limited(payload jsonb, client_ip text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.ip_bucket(client_ip);
begin
  if v_ip is not null then
    perform public.hit_rate_limit('trade:ip:' || v_ip, 3, interval '1 hour');
  end if;
  perform public.hit_rate_limit('trade:phone:' || regexp_replace(coalesce(payload ->> 'phone', ''), '\D', '', 'g'), 3, interval '1 day');
  return public.submit_trade_in(payload);
end;
$$;
revoke execute on function public.submit_trade_in_limited(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_trade_in_limited(jsonb, text) to service_role;

-- As versões sem limite deixam de ser públicas.
revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
revoke execute on function public.submit_trade_in(jsonb) from public, anon, authenticated;

-- Pedido de WhatsApp sem "Marcar como pago" passa a liberar o estoque em 12 h (antes 48 h).
create or replace function public.release_expired_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
begin
  for o in
    select id from public.orders
    where (status = 'awaiting_payment' and created_at < now() - interval '60 minutes')
       or (status = 'pending' and channel = 'whatsapp' and created_at < now() - interval '12 hours')
    for update skip locked
  loop
    update public.product_variants v set stock = v.stock + i.quantity
      from public.order_items i where i.order_id = o.id and i.variant_id = v.id;
    update public.orders set status = 'canceled',
      notes = concat_ws(E'\n', notes, 'Cancelado automaticamente por prazo; estoque devolvido.')
      where id = o.id;
  end loop;
end;
$$;
revoke execute on function public.release_expired_orders() from public, anon, authenticated;
