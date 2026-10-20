-- iStore White Label — schema base.
-- Uma instalação (projeto Supabase) por loja: dados, credenciais e pedidos ficam isolados.
-- Para evoluir para SaaS multi-tenant, adicione store_id nas tabelas e nas políticas.

-- ---------------------------------------------------------------------------
-- Administração
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Configuração da loja (marca, contato, comércio, SEO) — linha única.
-- Validada pelo app (lib/settings.ts). Nunca guarde segredos aqui: é pública.
-- ---------------------------------------------------------------------------
create table public.store_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();
insert into public.store_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  category text not null default 'iphone'
    check (category in ('iphone', 'ipad', 'mac', 'watch', 'airpods', 'acessorio')),
  family text,                       -- geração/linha usada no filtro, ex.: "iPhone 16"
  description text not null default '',
  specs jsonb not null default '[]'::jsonb,   -- [{ "label": "Tela", "value": "6,1\"" }]
  images text[] not null default '{}',
  warranty text not null default '',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_launch boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create index products_active_idx on public.products (is_active, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text,
  color_name text,
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9a-fA-F]{6}$'),
  storage text,                      -- "128 GB"; nulo para acessórios
  condition text not null default 'novo' check (condition in ('novo', 'seminovo', 'recondicionado')),
  battery_health smallint check (battery_health between 1 and 100),
  price_cents int not null check (price_cents > 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents > price_cents),
  stock int not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();
create index product_variants_product_idx on public.product_variants (product_id);
create unique index product_variants_sku_idx on public.product_variants (sku) where sku is not null;

-- ---------------------------------------------------------------------------
-- Entrega local (bairros) e avaliações reais
-- ---------------------------------------------------------------------------
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  fee_cents int not null default 0 check (fee_cents >= 0),
  eta text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 2 and 1000),
  source text not null default '',   -- ex.: "Google", "Instagram"
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.order_number_seq'),
  code text not null unique,
  channel text not null check (channel in ('whatsapp', 'online')),
  status text not null check (status in ('pending', 'awaiting_payment', 'paid', 'completed', 'canceled')),
  payment_status text not null default 'none'
    check (payment_status in ('none', 'pending', 'approved', 'rejected', 'refunded')),
  payment_provider text,
  payment_id text,
  paid_at timestamptz,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_zone_name text,
  address text,
  notes text,
  subtotal_cents int not null check (subtotal_cents >= 0),
  delivery_fee_cents int not null default 0 check (delivery_fee_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_label text not null default '',
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Solicitações de avaliação de aparelho usado (troca). Sem valor automático.
-- ---------------------------------------------------------------------------
create table public.trade_in_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  device_model text not null,
  storage text,
  battery_health smallint check (battery_health between 1 and 100),
  device_condition text not null,
  desired_product text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);
