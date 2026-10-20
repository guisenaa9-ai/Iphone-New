-- Row Level Security, funções de pedido e armazenamento de imagens.

alter table public.admin_users enable row level security;
alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.trade_in_requests enable row level security;

-- Admin
create policy "admins read admins" on public.admin_users for select using (public.is_admin());

-- Configuração: pública para leitura, editável só por admin
create policy "settings public read" on public.store_settings for select using (true);
create policy "settings admin update" on public.store_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- Catálogo
create policy "products public read" on public.products for select
  using (is_active or public.is_admin());
create policy "products admin write" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

create policy "variants public read" on public.product_variants for select
  using (
    public.is_admin()
    or (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active))
  );
create policy "variants admin write" on public.product_variants for all
  using (public.is_admin()) with check (public.is_admin());

create policy "zones public read" on public.delivery_zones for select using (is_active or public.is_admin());
create policy "zones admin write" on public.delivery_zones for all
  using (public.is_admin()) with check (public.is_admin());

create policy "reviews public read" on public.reviews for select using (is_published or public.is_admin());
create policy "reviews admin write" on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- Pedidos e trocas: somente admin lê/edita. Clientes criam via funções abaixo.
create policy "orders admin read" on public.orders for select using (public.is_admin());
create policy "orders admin update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
create policy "order items admin read" on public.order_items for select using (public.is_admin());
create policy "trade-ins admin read" on public.trade_in_requests for select using (public.is_admin());
create policy "trade-ins admin update" on public.trade_in_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- Status e pagamento não podem ser alterados diretamente: use admin_set_order_status.
revoke update on public.orders from anon, authenticated;
grant update (notes) on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- Libera o estoque reservado por pedidos abandonados:
--   online não pago após 60 minutos; WhatsApp pendente (sem "pago") após 48 horas.
-- Chamado a cada novo pedido, então não depende de agendador.
-- ---------------------------------------------------------------------------
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
       or (status = 'pending' and channel = 'whatsapp' and created_at < now() - interval '48 hours')
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

-- ---------------------------------------------------------------------------
-- Fechamento de pedido: preços, taxa de entrega e estoque vêm do banco,
-- nunca do navegador. Bloqueia as variantes para evitar venda acima do estoque.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg jsonb := coalesce((select data -> 'commerce' from public.store_settings where id = 1), '{}'::jsonb);
  v_channel text := payload ->> 'channel';
  v_fulfillment text := payload ->> 'fulfillment';
  v_name text := btrim(coalesce(payload -> 'customer' ->> 'name', ''));
  v_phone text := regexp_replace(coalesce(payload -> 'customer' ->> 'phone', ''), '\D', '', 'g');
  v_email text := nullif(btrim(coalesce(payload -> 'customer' ->> 'email', '')), '');
  v_address text := nullif(btrim(coalesce(payload ->> 'address', '')), '');
  v_notes text := nullif(btrim(coalesce(payload ->> 'notes', '')), '');
  v_mode text := coalesce(cfg ->> 'salesMode', 'whatsapp');
  v_zone public.delivery_zones;
  v_fee int := 0;
  v_subtotal int := 0;
  v_order public.orders;
  v_item jsonb;
  v_qty int;
  v_var record;
  v_items jsonb := '[]'::jsonb;
  v_prefix text := upper(left(regexp_replace(coalesce(cfg ->> 'orderPrefix', 'PED'), '[^A-Za-z0-9]', '', 'g'), 6));
begin
  perform public.release_expired_orders();

  if v_channel not in ('whatsapp', 'online') then
    raise exception 'invalid_channel' using errcode = '22023';
  end if;
  if (v_channel = 'whatsapp' and v_mode = 'online') or (v_channel = 'online' and v_mode = 'whatsapp') then
    raise exception 'channel_disabled' using errcode = '22023';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if char_length(v_phone) < 10 or char_length(v_phone) > 13 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(coalesce(v_notes, '')) > 500 or char_length(coalesce(v_address, '')) > 300 then
    raise exception 'text_too_long' using errcode = '22023';
  end if;

  if v_fulfillment = 'pickup' then
    if coalesce((cfg ->> 'pickupEnabled')::boolean, true) is not true then
      raise exception 'pickup_disabled' using errcode = '22023';
    end if;
  elsif v_fulfillment = 'delivery' then
    if coalesce((cfg ->> 'deliveryEnabled')::boolean, false) is not true then
      raise exception 'delivery_disabled' using errcode = '22023';
    end if;
    select * into v_zone from public.delivery_zones
      where id = (payload ->> 'zone_id')::uuid and is_active;
    if not found then
      raise exception 'invalid_zone' using errcode = '22023';
    end if;
    if v_address is null or char_length(v_address) < 5 then
      raise exception 'invalid_address' using errcode = '22023';
    end if;
    v_fee := v_zone.fee_cents;
  else
    raise exception 'invalid_fulfillment' using errcode = '22023';
  end if;

  if jsonb_typeof(payload -> 'items') <> 'array'
     or jsonb_array_length(payload -> 'items') = 0
     or jsonb_array_length(payload -> 'items') > 20 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;
  if (select count(distinct value ->> 'variant_id') from jsonb_array_elements(payload -> 'items'))
     <> jsonb_array_length(payload -> 'items') then
    raise exception 'duplicate_items' using errcode = '22023';
  end if;

  insert into public.orders (code, channel, status, payment_status, customer_name, customer_phone,
    customer_email, fulfillment, delivery_zone_id, delivery_zone_name, address, notes,
    subtotal_cents, delivery_fee_cents, total_cents)
  values ('tmp-' || gen_random_uuid(), v_channel,
    case when v_channel = 'online' then 'awaiting_payment' else 'pending' end,
    case when v_channel = 'online' then 'pending' else 'none' end,
    v_name, v_phone, v_email, v_fulfillment, v_zone.id, v_zone.name,
    case when v_fulfillment = 'delivery' then v_address end, v_notes, 0, v_fee, 0)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;

    select v.*, p.name as product_name, p.id as pid into v_var
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where v.id = (v_item ->> 'variant_id')::uuid and v.is_active and p.is_active
      for update of v;
    if not found then
      raise exception 'variant_unavailable' using errcode = 'P0002';
    end if;
    if v_var.stock < v_qty then
      raise exception 'insufficient_stock:%', v_var.id using errcode = 'P0001';
    end if;

    update public.product_variants set stock = stock - v_qty where id = v_var.id;
    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_label,
      unit_price_cents, quantity)
    values (v_order.id, v_var.pid, v_var.id, v_var.product_name,
      concat_ws(' · ', v_var.storage, v_var.color_name,
        case v_var.condition when 'seminovo' then 'Seminovo' when 'recondicionado' then 'Recondicionado' end),
      v_var.price_cents, v_qty);

    v_subtotal := v_subtotal + v_var.price_cents * v_qty;
    v_items := v_items || jsonb_build_object(
      'name', v_var.product_name,
      'variant', concat_ws(' · ', v_var.storage, v_var.color_name,
        case v_var.condition when 'seminovo' then 'Seminovo' when 'recondicionado' then 'Recondicionado' end),
      'quantity', v_qty,
      'unit_price_cents', v_var.price_cents);
  end loop;

  update public.orders
    set code = coalesce(nullif(v_prefix, ''), 'PED') || '-' || v_order.number,
        subtotal_cents = v_subtotal,
        total_cents = v_subtotal + v_fee
    where id = v_order.id
    returning * into v_order;

  return jsonb_build_object(
    'id', v_order.id,
    'code', v_order.code,
    'subtotal_cents', v_order.subtotal_cents,
    'delivery_fee_cents', v_order.delivery_fee_cents,
    'total_cents', v_order.total_cents,
    'items', v_items);
end;
$$;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Resumo público do pedido (o id é um UUID aleatório que só o comprador recebe).
create or replace function public.get_order_public(order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id, 'code', o.code, 'channel', o.channel, 'status', o.status,
    'payment_status', o.payment_status, 'fulfillment', o.fulfillment,
    'subtotal_cents', o.subtotal_cents, 'delivery_fee_cents', o.delivery_fee_cents,
    'total_cents', o.total_cents, 'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'name', i.product_name, 'variant', i.variant_label,
      'quantity', i.quantity, 'unit_price_cents', i.unit_price_cents))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o where o.id = order_id;
$$;
grant execute on function public.get_order_public(uuid) to anon, authenticated;

-- Mudança de status pelo painel. Cancelar devolve o estoque.
-- Pedidos online só ficam "pagos" via webhook do provedor (confirm_payment).
create or replace function public.admin_set_order_status(order_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into o from public.orders where id = order_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if new_status not in ('pending', 'paid', 'completed', 'canceled') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if o.status = 'canceled' then
    raise exception 'order_canceled' using errcode = '22023';
  end if;
  if new_status = 'paid' and o.channel = 'online' then
    raise exception 'online_paid_requires_provider' using errcode = '22023';
  end if;
  if new_status = 'completed' and o.channel = 'online' and o.payment_status <> 'approved' then
    raise exception 'online_not_paid' using errcode = '22023';
  end if;

  if new_status = 'canceled' then
    update public.product_variants v set stock = v.stock + i.quantity
      from public.order_items i where i.order_id = o.id and i.variant_id = v.id;
  end if;

  update public.orders set
    status = new_status,
    paid_at = case when new_status in ('paid', 'completed') and paid_at is null then now() else paid_at end
  where id = o.id;
end;
$$;
revoke execute on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

-- Confirmação de pagamento: só o servidor (service_role) chama, após validar o webhook
-- e consultar o pagamento direto na API do provedor.
create or replace function public.confirm_payment(
  order_id uuid, provider text, provider_payment_id text, provider_status text, amount_cents int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = order_id for update;
  if not found then
    return 'not_found';
  end if;

  if provider_status = 'approved' then
    if amount_cents <> o.total_cents then
      return 'amount_mismatch';
    end if;
    if o.status = 'canceled' then
      -- Pago depois de expirar: registra para a loja resolver (reembolso ou reativação manual).
      update public.orders set payment_status = 'approved', payment_provider = provider,
        payment_id = provider_payment_id, paid_at = now(),
        notes = concat_ws(E'\n', notes, 'Pagamento aprovado após cancelamento por prazo. Verificar estoque.')
        where id = o.id;
      return 'approved_after_cancel';
    end if;
    update public.orders set status = case when status = 'completed' then status else 'paid' end,
      payment_status = 'approved', payment_provider = provider, payment_id = provider_payment_id,
      paid_at = coalesce(paid_at, now())
      where id = o.id;
    return 'paid';
  elsif provider_status in ('rejected', 'cancelled') then
    update public.orders set payment_status = 'rejected', payment_provider = provider,
      payment_id = provider_payment_id
      where id = o.id and payment_status <> 'approved';
    return 'rejected';
  elsif provider_status in ('refunded', 'charged_back') then
    update public.orders set payment_status = 'refunded', payment_provider = provider,
      payment_id = provider_payment_id
      where id = o.id;
    return 'refunded';
  end if;
  return 'ignored';
end;
$$;
revoke execute on function public.confirm_payment(uuid, text, text, text, int) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, text, text, text, int) to service_role;

-- Desfaz um pedido online que nem chegou ao provedor (falha ao criar o checkout).
create or replace function public.release_order(order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_variants v set stock = v.stock + i.quantity
    from public.order_items i, public.orders o
    where i.order_id = o.id and o.id = release_order.order_id and o.status = 'awaiting_payment'
      and i.variant_id = v.id;
  update public.orders set status = 'canceled'
    where id = release_order.order_id and status = 'awaiting_payment';
end;
$$;
revoke execute on function public.release_order(uuid) from public, anon, authenticated;
grant execute on function public.release_order(uuid) to service_role;

-- Formulário de troca (público, com validação).
create or replace function public.submit_trade_in(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := btrim(coalesce(payload ->> 'name', ''));
  v_phone text := regexp_replace(coalesce(payload ->> 'phone', ''), '\D', '', 'g');
  v_model text := btrim(coalesce(payload ->> 'device_model', ''));
  v_cond text := btrim(coalesce(payload ->> 'device_condition', ''));
begin
  if char_length(v_name) not between 2 and 80
     or char_length(v_phone) not between 10 and 13
     or char_length(v_model) not between 2 and 80
     or char_length(v_cond) not between 2 and 1000
     or char_length(coalesce(payload ->> 'storage', '')) > 20
     or char_length(coalesce(payload ->> 'desired_product', '')) > 120 then
    raise exception 'invalid_trade_in' using errcode = '22023';
  end if;
  insert into public.trade_in_requests (customer_name, customer_phone, device_model, storage,
    battery_health, device_condition, desired_product)
  values (v_name, v_phone, v_model, nullif(payload ->> 'storage', ''),
    nullif(payload ->> 'battery_health', '')::smallint, v_cond, nullif(payload ->> 'desired_product', ''))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.submit_trade_in(jsonb) to anon, authenticated;

-- Mais vendidos (somente pedidos pagos/concluídos) — usado na home e no painel.
create or replace function public.best_sellers(limit_count int default 8)
returns table (product_id uuid, units bigint)
language sql
stable
security definer
set search_path = public
as $$
  select i.product_id, sum(i.quantity) as units
  from public.order_items i
  join public.orders o on o.id = i.order_id
  join public.products p on p.id = i.product_id and p.is_active
  where o.status in ('paid', 'completed')
  group by i.product_id
  order by units desc
  limit least(greatest(limit_count, 1), 24);
$$;
grant execute on function public.best_sellers(int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: bucket público de imagens; escrita só para admins.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon'])
on conflict (id) do nothing;

create policy "store assets admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-assets' and public.is_admin());
create policy "store assets admin update" on storage.objects for update to authenticated
  using (bucket_id = 'store-assets' and public.is_admin());
create policy "store assets admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'store-assets' and public.is_admin());
