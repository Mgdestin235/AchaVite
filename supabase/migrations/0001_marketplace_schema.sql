-- AchaVite marketplace schema: Super Admin / Vendor / Customer
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'vendor', 'customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type store_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('active', 'inactive', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('nouvelle', 'confirmee', 'preparation', 'expediee', 'livree', 'annulee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('attente', 'reussi', 'echoue', 'annule');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_mode as enum ('domicile', 'relais', 'boutique');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users with app-level role/status)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role user_role not null default 'customer',
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row for every new auth user. The role can be
-- pre-set via `user_metadata.role` at signup (used by the vendor
-- registration flow); it defaults to 'customer' otherwise.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used throughout RLS policies to read the caller's role cheaply.
create or replace function public.current_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Categories (platform-wide, moderated by Super Admin)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

insert into public.categories (name, slug, icon) values
  ('Téléphones', 'telephones', 'Smartphone'),
  ('Électronique', 'electronique', 'Headphones'),
  ('Mode', 'mode', 'Shirt'),
  ('Beauté', 'beaute', 'Sparkles'),
  ('Maison', 'maison', 'Home'),
  ('Accessoires', 'accessoires', 'Watch'),
  ('Services', 'services', 'Wrench')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Stores (one per vendor; must be approved by Super Admin before selling)
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  banner_url text,
  description text,
  phone text,
  whatsapp_number text,
  address text,
  city text,
  category_id uuid references public.categories(id),
  opening_hours text,
  delivery_info text,
  status store_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stores_owner_idx on public.stores(owner_id);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id),
  name text not null,
  slug text not null,
  description text,
  highlights text[] not null default '{}',
  price numeric(12,2) not null,
  old_price numeric(12,2),
  stock int not null default 0,
  video_url text,
  status product_status not null default 'active',
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  rating numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  sold_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);
create index if not exists products_store_idx on public.products(store_id);
create index if not exists products_category_idx on public.products(category_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  position int not null default 0
);
create index if not exists product_images_product_idx on public.product_images(product_id);

create table if not exists public.product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  url text not null,
  kind text not null check (kind in ('pdf', 'ebook'))
);
create index if not exists product_files_product_idx on public.product_files(product_id);

-- ---------------------------------------------------------------------------
-- Delivery zones & promo codes (each vendor configures their own)
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  city text not null,
  fee_domicile numeric(12,2) not null default 0,
  fee_relais numeric(12,2) not null default 0,
  has_relais boolean not null default false,
  has_boutique boolean not null default false,
  relais_points text[] not null default '{}',
  unique(store_id, city)
);

create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(12,2) not null,
  start_date date not null,
  end_date date not null,
  max_uses int not null default 0,
  used int not null default 0,
  active boolean not null default true,
  unique(store_id, code)
);

-- ---------------------------------------------------------------------------
-- Orders (platform-wide; items carry the store so vendors only see theirs)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid references public.profiles(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_city text,
  customer_address text,
  customer_neighborhood text,
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  promo_code text,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  delivery_mode delivery_mode not null,
  relais_point text,
  payment_method text,
  payment_status payment_status not null default 'attente',
  status order_status not null default 'nouvelle',
  digital_delivered boolean not null default false,
  created_at timestamptz not null default now(),
  estimated_delivery timestamptz
);
create index if not exists orders_customer_idx on public.orders(customer_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  product_id uuid references public.products(id),
  name text not null,
  image text,
  price numeric(12,2) not null,
  quantity int not null,
  subtotal numeric(12,2) not null,
  commission_amount numeric(12,2) not null default 0,
  vendor_payout numeric(12,2) not null default 0
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_store_idx on public.order_items(store_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null,
  status payment_status not null default 'attente',
  transaction_id text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reviews, favorites, notifications
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(customer_id, product_id)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(customer_id, product_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);

-- ---------------------------------------------------------------------------
-- Platform-wide settings (commission rate, etc.) -- single row
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id int primary key default 1,
  commission_percent numeric(5,2) not null default 10,
  check (id = 1)
);
insert into public.platform_settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_files enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promos enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.platform_settings enable row level security;

-- profiles: everyone can read (needed to display vendor/store owner info
-- publicly); users manage their own row; super admin manages all.
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);
create policy "profiles_update_super_admin" on public.profiles for update using (public.current_role() = 'super_admin');

-- categories: public read; only super admin writes.
create policy "categories_select_all" on public.categories for select using (true);
create policy "categories_write_super_admin" on public.categories for all
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- stores: public can see approved stores; owner sees/manages their own
-- regardless of status; super admin manages all (approve/reject/suspend).
create policy "stores_select_public" on public.stores for select
  using (status = 'approved' or owner_id = auth.uid() or public.current_role() = 'super_admin');
create policy "stores_insert_vendor" on public.stores for insert
  with check (owner_id = auth.uid());
create policy "stores_update_owner_or_admin" on public.stores for update
  using (owner_id = auth.uid() or public.current_role() = 'super_admin');
create policy "stores_delete_owner_or_admin" on public.stores for delete
  using (owner_id = auth.uid() or public.current_role() = 'super_admin');

-- products: public can see active products of approved stores; the owning
-- vendor manages their own store's products; super admin manages all.
create policy "products_select_public" on public.products for select
  using (
    (status = 'active' and exists (select 1 from public.stores s where s.id = store_id and s.status = 'approved'))
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );
create policy "products_write_owner_or_admin" on public.products for all
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  )
  with check (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- product_images / product_files: follow the parent product's access.
create policy "product_images_select" on public.product_images for select
  using (exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = product_id
      and ((p.status = 'active' and s.status = 'approved') or s.owner_id = auth.uid() or public.current_role() = 'super_admin')
  ));
create policy "product_images_write" on public.product_images for all
  using (exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = product_id and (s.owner_id = auth.uid() or public.current_role() = 'super_admin')
  ));

create policy "product_files_select" on public.product_files for select
  using (exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = product_id
      and ((p.status = 'active' and s.status = 'approved') or s.owner_id = auth.uid() or public.current_role() = 'super_admin')
  ));
create policy "product_files_write" on public.product_files for all
  using (exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = product_id and (s.owner_id = auth.uid() or public.current_role() = 'super_admin')
  ));

-- delivery_zones / promos: owning vendor manages theirs; public can read
-- (needed at checkout); super admin manages all.
create policy "delivery_zones_select" on public.delivery_zones for select using (true);
create policy "delivery_zones_write" on public.delivery_zones for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.current_role() = 'super_admin');

create policy "promos_select" on public.promos for select using (true);
create policy "promos_write" on public.promos for all
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.current_role() = 'super_admin');

-- orders: the customer sees their own orders; super admin sees all; a
-- vendor's access is scoped through order_items instead (an order can span
-- multiple stores, so vendors never read the whole order row directly).
create policy "orders_select_customer_or_admin" on public.orders for select
  using (customer_id = auth.uid() or public.current_role() = 'super_admin' or customer_id is null);
create policy "orders_insert_anyone" on public.orders for insert with check (true);
create policy "orders_update_customer_or_admin" on public.orders for update
  using (customer_id = auth.uid() or public.current_role() = 'super_admin');

-- order_items: visible to the order's customer, the item's store owner, or
-- super admin.
create policy "order_items_select" on public.order_items for select
  using (
    exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or o.customer_id is null))
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );
create policy "order_items_insert_anyone" on public.order_items for insert with check (true);
create policy "order_items_update_store_or_admin" on public.order_items for update
  using (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()) or public.current_role() = 'super_admin');

-- payments: same visibility as the parent order.
create policy "payments_select" on public.payments for select
  using (
    exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or o.customer_id is null))
    or public.current_role() = 'super_admin'
  );
create policy "payments_insert_anyone" on public.payments for insert with check (true);
create policy "payments_update_admin" on public.payments for update using (public.current_role() = 'super_admin');

-- reviews: public read; customer manages their own.
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_write_own" on public.reviews for all using (customer_id = auth.uid());

-- favorites: private to the customer.
create policy "favorites_select_own" on public.favorites for select using (customer_id = auth.uid());
create policy "favorites_write_own" on public.favorites for all using (customer_id = auth.uid());

-- notifications: private to the recipient; super admin can create any.
create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_insert_admin" on public.notifications for insert with check (public.current_role() = 'super_admin' or user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid());

-- platform_settings: public read (commission shown in UI copy if needed);
-- only super admin writes.
create policy "platform_settings_select_all" on public.platform_settings for select using (true);
create policy "platform_settings_write_admin" on public.platform_settings for update using (public.current_role() = 'super_admin');
