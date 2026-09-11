-- CRITICAL: fixes "infinite recursion detected in policy for relation
-- order_items", which has been silently breaking every product listing in
-- the app (vendor's own "Mes produits", the public catalogue, category
-- pages, product detail pages, the cart) because every one of them embeds
-- product_files in its select, and product_files_select (0003) queries
-- order_items.
--
-- Root cause: a genuine circular RLS reference introduced in 0003.
--   order_items_select  -> subquery on orders   (to check o.customer_id)
--   orders_select_vendor_scoped -> subquery on order_items (to check the
--                                   vendor owns an item in that order)
-- Querying order_items evaluates order_items_select, which evaluates
-- orders' policies, one of which queries order_items again -> Postgres
-- detects the cycle and refuses the whole query, for every caller
-- (including a vendor reading their own products, and anonymous buyers --
-- confirmed live: `select id from products` alone worked, but the exact
-- same query joining product_files, which listVendorProducts/
-- listPublicProducts/getPublicProductBySlug/listPublicProductsByIds all
-- do, failed with this error for every role, RLS-bypassing service_role
-- included only because that key skips RLS entirely).
--
-- Fix: break the cycle the same way current_role() and
-- store_has_active_subscription() already do elsewhere in this project --
-- move the order_items lookup into a `security definer` function. Such a
-- function runs as its owner (the migration role, which bypasses RLS as
-- the table owner), so the order_items query inside it does not
-- re-trigger order_items' own SELECT policy. order_items_select's
-- subquery on orders is unchanged and still fine (orders_select_vendor_
-- scoped no longer re-enters order_items' RLS), so the loop is gone.
create or replace function public.vendor_owns_order_item(p_order_id uuid, p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.order_items oi
    join public.stores s on s.id = oi.store_id
    where oi.order_id = p_order_id and s.owner_id = p_owner_id
  );
$$;

drop policy if exists "orders_select_vendor_scoped" on public.orders;
create policy "orders_select_vendor_scoped" on public.orders for select
  using (public.vendor_owns_order_item(orders.id, auth.uid()));
