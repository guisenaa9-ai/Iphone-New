-- Funções do painel: salvar produto + variantes numa transação e indicadores do dashboard.

create or replace function public.admin_save_product(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := nullif(payload ->> 'id', '')::uuid;
  v jsonb;
  vid uuid;
  keep uuid[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(payload -> 'variants') <> 'array' or jsonb_array_length(payload -> 'variants') = 0 then
    raise exception 'variants_required' using errcode = '22023';
  end if;

  if pid is null then
    insert into public.products (slug, name, category, family, description, specs, images, warranty,
      is_active, is_featured, is_launch, sort_order)
    values (payload ->> 'slug', payload ->> 'name', payload ->> 'category', nullif(payload ->> 'family', ''),
      coalesce(payload ->> 'description', ''), coalesce(payload -> 'specs', '[]'),
      coalesce(array(select jsonb_array_elements_text(payload -> 'images')), '{}'),
      coalesce(payload ->> 'warranty', ''), coalesce((payload ->> 'is_active')::boolean, true),
      coalesce((payload ->> 'is_featured')::boolean, false), coalesce((payload ->> 'is_launch')::boolean, false),
      coalesce((payload ->> 'sort_order')::int, 0))
    returning id into pid;
  else
    update public.products set
      slug = payload ->> 'slug', name = payload ->> 'name', category = payload ->> 'category',
      family = nullif(payload ->> 'family', ''), description = coalesce(payload ->> 'description', ''),
      specs = coalesce(payload -> 'specs', '[]'),
      images = coalesce(array(select jsonb_array_elements_text(payload -> 'images')), '{}'),
      warranty = coalesce(payload ->> 'warranty', ''), is_active = coalesce((payload ->> 'is_active')::boolean, true),
      is_featured = coalesce((payload ->> 'is_featured')::boolean, false),
      is_launch = coalesce((payload ->> 'is_launch')::boolean, false),
      sort_order = coalesce((payload ->> 'sort_order')::int, 0)
    where id = pid;
    if not found then
      raise exception 'not_found' using errcode = 'P0002';
    end if;
  end if;

  for v in select * from jsonb_array_elements(payload -> 'variants') loop
    vid := nullif(v ->> 'id', '')::uuid;
    if vid is not null then
      update public.product_variants set
        sku = nullif(v ->> 'sku', ''), color_name = nullif(v ->> 'color_name', ''),
        color_hex = nullif(v ->> 'color_hex', ''), storage = nullif(v ->> 'storage', ''),
        condition = v ->> 'condition', battery_health = nullif(v ->> 'battery_health', '')::smallint,
        price_cents = (v ->> 'price_cents')::int, compare_at_cents = nullif(v ->> 'compare_at_cents', '')::int,
        stock = (v ->> 'stock')::int,
        images = coalesce(array(select jsonb_array_elements_text(v -> 'images')), '{}'),
        is_active = coalesce((v ->> 'is_active')::boolean, true), sort_order = coalesce((v ->> 'sort_order')::int, 0)
      where id = vid and product_id = pid;
      if not found then
        vid := null;
      end if;
    end if;
    if vid is null then
      insert into public.product_variants (product_id, sku, color_name, color_hex, storage, condition,
        battery_health, price_cents, compare_at_cents, stock, images, is_active, sort_order)
      values (pid, nullif(v ->> 'sku', ''), nullif(v ->> 'color_name', ''), nullif(v ->> 'color_hex', ''),
        nullif(v ->> 'storage', ''), v ->> 'condition', nullif(v ->> 'battery_health', '')::smallint,
        (v ->> 'price_cents')::int, nullif(v ->> 'compare_at_cents', '')::int, (v ->> 'stock')::int,
        coalesce(array(select jsonb_array_elements_text(v -> 'images')), '{}'),
        coalesce((v ->> 'is_active')::boolean, true), coalesce((v ->> 'sort_order')::int, 0))
      returning id into vid;
    end if;
    keep := keep || vid;
  end loop;

  -- Variantes removidas no formulário. Pedidos antigos mantêm o nome e o preço gravados.
  delete from public.product_variants where product_id = pid and not (id = any (keep));
  return pid;
end;
$$;
revoke execute on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;

create or replace function public.admin_dashboard(days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  threshold int := coalesce((select (data -> 'commerce' ->> 'lowStockThreshold')::int from public.store_settings where id = 1), 2);
  since timestamptz := date_trunc('day', now()) - make_interval(days => greatest(least(days, 365), 1) - 1);
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'products_total', (select count(*) from public.products),
    'products_active', (select count(*) from public.products where is_active),
    'low_stock', (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
                  where v.is_active and p.is_active and v.stock <= threshold),
    'orders_total', (select count(*) from public.orders where created_at >= since),
    'orders_pending', (select count(*) from public.orders where status in ('pending', 'awaiting_payment')),
    'orders_completed', (select count(*) from public.orders where status = 'completed' and created_at >= since),
    'revenue_cents', (select coalesce(sum(total_cents), 0) from public.orders
                      where status in ('paid', 'completed') and paid_at >= since),
    'revenue_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'cents', coalesce(r.cents, 0)) order by d), '[]')
                       from generate_series(since, date_trunc('day', now()), interval '1 day') d
                       left join (select date_trunc('day', paid_at) as day, sum(total_cents) as cents
                                  from public.orders where status in ('paid', 'completed') and paid_at >= since
                                  group by 1) r on r.day = d),
    'top_products', (select coalesce(jsonb_agg(t), '[]') from (
                       select i.product_name as name, sum(i.quantity) as units, sum(i.quantity * i.unit_price_cents) as cents
                       from public.order_items i join public.orders o on o.id = i.order_id
                       where o.status in ('paid', 'completed') and o.paid_at >= since
                       group by i.product_name order by units desc limit 5) t),
    'low_stock_items', (select coalesce(jsonb_agg(t), '[]') from (
                       select p.id as product_id, p.name, v.storage, v.color_name, v.stock
                       from public.product_variants v join public.products p on p.id = v.product_id
                       where v.is_active and p.is_active and v.stock <= threshold
                       order by v.stock, p.name limit 8) t)
  );
end;
$$;
revoke execute on function public.admin_dashboard(int) from public, anon;
grant execute on function public.admin_dashboard(int) to authenticated;
