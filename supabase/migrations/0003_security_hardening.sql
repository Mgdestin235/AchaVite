-- Security hardening pass — fixes the following, found by a security audit
-- of the live app (see security-report.md if present):
--
--   CRITICAL  Anyone could self-assign the super_admin role at signup
--             (handle_new_user() trusted the client-supplied metadata role).
--   CRITICAL  Any authenticated user could rewrite their own profiles row,
--             including role/status (profiles_update_self had no with check
--             and no column restriction).
--   CRITICAL  A customer could set their own order's payment_status to
--             'reussi' (orders_update_customer_or_admin had no with check),
--             or insert an order already marked paid.
--   HIGH      profiles was readable by anyone (name + phone of every user).
--   HIGH      Digital product files (PDF/ebook) were downloadable by anyone
--              from the product page, before any purchase.
--   HIGH      Order line prices/commission/vendor payout were whatever the
--              browser sent, never re-verified against the real product.
--   HIGH      A vendor could set their own store's status to 'approved',
--              or un-suspend themselves.
--   MEDIUM    decrement_product_stock() accepted a negative quantity,
--              which would *increase* stock instead of decreasing it.
--   MEDIUM    A suspended account (profiles.status = 'suspended') kept every
--              permission tied to its role — suspension had no real effect.
--   MEDIUM    Promo code lookup used unescaped ILIKE, so a code containing
--              "%" matched unrelated promos.
--
-- Run this once against the live project (0001 and 0002 already ran there).

-- ---------------------------------------------------------------------------
-- 1. Never let signup metadata grant super_admin. "vendor" stays allowed —
--    vendor self-registration is intentionally open (gated by store
--    approval afterwards, not by account role).
-- ---------------------------------------------------------------------------
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
    case (new.raw_user_meta_data ->> 'role')
      when 'vendor' then 'vendor'::user_role
      else 'customer'::user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. A suspended account loses every role-based permission immediately,
--    everywhere current_role() is used in a policy.
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

-- ---------------------------------------------------------------------------
-- 3. profiles: stop exposing every user's name/phone publicly. Nothing in
--    the app reads another user's profile (checked: every query filters
--    .eq("id", <self>) except the Super Admin users page, which is covered
--    by the current_role() branch). profiles_update_self is dropped
--    entirely -- no app code updates a caller's own profile row; the only
--    writes are Super Admin managing other users via profiles_update_super_admin.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'super_admin');

drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin" on public.profiles for update
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- 4. stores: a vendor can edit their own store's details, but never its own
--    moderation status -- that's forced back to its prior value (or 'pending'
--    on insert) unless the actor is Super Admin.
-- ---------------------------------------------------------------------------
create or replace function public.force_store_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() = 'super_admin' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
  else
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists stores_force_status on public.stores;
create trigger stores_force_status
  before insert or update on public.stores
  for each row execute function public.force_store_status();

-- ---------------------------------------------------------------------------
-- 5. orders: force every admin-controlled field back to a safe value on
--    insert/update unless the actor is Super Admin. This is enforced at the
--    trigger level (not just RLS) so it can't be bypassed by omitting a
--    WITH CHECK edge case, and it needs no column-level GRANT changes.
-- ---------------------------------------------------------------------------
create or replace function public.force_order_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo record;
begin
  -- A nested trigger depth means this UPDATE was issued by
  -- recompute_order_totals() (order_items -> orders), a trusted internal
  -- side effect, not a direct client write -- let it through untouched.
  -- Without this, that trigger's own subtotal/total/status update would
  -- immediately be reverted right back by this one.
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if public.current_role() = 'super_admin' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.payment_status := 'attente';
    new.status := 'nouvelle';
    new.digital_delivered := false;
    new.payment_method := null;
    if new.customer_id is not null and new.customer_id <> auth.uid() then
      new.customer_id := auth.uid();
    end if;

    -- Enforce max_uses here (once per order) rather than in the per-item
    -- trigger. A promo whose uses are exhausted, or that doesn't exist,
    -- silently stops applying rather than blocking checkout.
    if new.promo_code is not null then
      select * into v_promo from public.promos
      where code = new.promo_code and active and current_date between start_date and end_date;
      if v_promo is null or (v_promo.max_uses > 0 and v_promo.used >= v_promo.max_uses) then
        new.promo_code := null;
        new.discount := 0;
      else
        update public.promos set used = used + 1 where id = v_promo.id;
      end if;
    end if;
  else
    new.payment_status := old.payment_status;
    new.status := old.status;
    new.digital_delivered := old.digital_delivered;
    new.customer_id := old.customer_id;
    new.subtotal := old.subtotal;
    new.discount := old.discount;
    new.delivery_fee := old.delivery_fee;
    new.total := old.total;
    new.promo_code := old.promo_code;
    -- payment_method: still settable by the order's own customer (that's
    -- how /api/orders/set-payment-method records the chosen method), just
    -- not the financial/fulfillment fields above.
  end if;
  return new;
end;
$$;

drop trigger if exists orders_force_admin_fields on public.orders;
create trigger orders_force_admin_fields
  before insert or update on public.orders
  for each row execute function public.force_order_admin_fields();

-- A vendor could never actually see their own commandes: the vendor
-- dashboard/orders page joins order_items -> orders (customer name, phone,
-- payment_status), but no policy granted a vendor any access to `orders` at
-- all (only to order_items, via a *different* scoped policy) -- so that
-- join always came back null, and every vendor-side order stat/status was
-- silently stuck showing nothing.
create policy "orders_select_vendor_scoped" on public.orders for select
  using (
    exists (
      select 1 from public.order_items oi join public.stores s on s.id = oi.store_id
      where oi.order_id = orders.id and s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. order_items: price, commission, vendor payout, store_id, name and image
--    are always re-derived from the real product row server-side, never
--    trusted from the client. This also verifies stock and decrements it
--    atomically here instead of via a separate client-triggered RPC call.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product record;
  v_commission_percent numeric;
begin
  if new.quantity is null or new.quantity < 1 then
    raise exception 'Quantité invalide';
  end if;

  select * into v_product from public.products where id = new.product_id;
  if v_product is null then
    raise exception 'Produit introuvable';
  end if;
  if v_product.status <> 'active' then
    raise exception 'Produit indisponible';
  end if;
  if v_product.stock < new.quantity then
    raise exception 'Stock insuffisant pour %', v_product.name;
  end if;

  select commission_percent into v_commission_percent from public.platform_settings where id = 1;

  new.store_id := v_product.store_id;
  new.name := v_product.name;
  new.image := (
    select url from public.product_images
    where product_id = v_product.id
    order by position
    limit 1
  );
  new.price := v_product.price;
  new.subtotal := v_product.price * new.quantity;
  new.commission_amount := round(new.subtotal * coalesce(v_commission_percent, 10) / 100, 2);
  new.vendor_payout := new.subtotal - new.commission_amount;
  new.status := 'nouvelle';

  update public.products
  set stock = stock - new.quantity,
      sold_count = sold_count + new.quantity
  where id = v_product.id;

  return new;
end;
$$;

drop trigger if exists order_items_recompute on public.order_items;
create trigger order_items_recompute
  before insert on public.order_items
  for each row execute function public.recompute_order_item();

-- Keeps the parent order's subtotal/total tied to the real item prices.
-- delivery_fee and discount are still taken from the order row as submitted
-- at checkout (multi-store delivery-fee math happens client-side) -- a
-- smaller residual gap than the item prices themselves, tracked as a
-- follow-up rather than solved here. Also allocates a store-scoped promo's
-- discount across that store's own items, deducted from vendor_payout only
-- (never from commission_amount, so the promo the vendor created themselves
-- can't cost the platform money), and keeps orders.status in sync with the
-- least-advanced status among its items -- the app itself never wrote
-- orders.status directly (only order_items.status), so it was permanently
-- stuck on 'nouvelle'.
create or replace function public.recompute_order_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric;
  v_discount numeric;
  v_delivery_fee numeric;
  v_promo_code text;
  v_promo_store_id uuid;
  v_store_subtotal numeric;
  v_statuses order_status[];
  v_overall order_status;
  v_order_of_status text[] := array['nouvelle','confirmee','preparation','expediee','livree'];
  v_min_pos int;
  s order_status;
  pos int;
begin
  select coalesce(sum(subtotal), 0) into v_subtotal
  from public.order_items where order_id = new.order_id;

  select discount, delivery_fee, promo_code into v_discount, v_delivery_fee, v_promo_code
  from public.orders where id = new.order_id;

  update public.orders
  set subtotal = v_subtotal,
      total = greatest(v_subtotal - coalesce(v_discount, 0), 0) + coalesce(v_delivery_fee, 0)
  where id = new.order_id;

  if v_promo_code is not null and coalesce(v_discount, 0) > 0 then
    select store_id into v_promo_store_id from public.promos where code = v_promo_code limit 1;
    if v_promo_store_id is not null then
      select coalesce(sum(subtotal), 0) into v_store_subtotal
      from public.order_items where order_id = new.order_id and store_id = v_promo_store_id;
      if v_store_subtotal > 0 then
        update public.order_items
        set vendor_payout = greatest(subtotal - commission_amount - round(v_discount * subtotal / v_store_subtotal, 2), 0)
        where order_id = new.order_id and store_id = v_promo_store_id;
      end if;
    end if;
  end if;

  select array_agg(status) into v_statuses from public.order_items where order_id = new.order_id;
  if v_statuses is not null then
    if 'annulee' = any(v_statuses) then
      v_overall := 'annulee';
    else
      v_min_pos := null;
      foreach s in array v_statuses loop
        pos := array_position(v_order_of_status, s::text);
        if pos is not null and (v_min_pos is null or pos < v_min_pos) then
          v_min_pos := pos;
        end if;
      end loop;
      v_overall := coalesce(v_order_of_status[v_min_pos]::order_status, 'nouvelle');
    end if;
    update public.orders set status = v_overall where id = new.order_id and status <> v_overall;
  end if;

  return new;
end;
$$;

drop trigger if exists order_items_recompute_order_totals on public.order_items;
create trigger order_items_recompute_order_totals
  after insert or update of status on public.order_items
  for each row execute function public.recompute_order_totals();

-- The trigger above now decrements stock atomically per item; the app no
-- longer needs to call this separately (and doing so would double-decrement
-- it), so it's no longer publicly callable. Still guarded against a
-- negative/zero quantity for any future internal use.
create or replace function public.decrement_product_stock(p_product_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantité invalide';
  end if;
  update public.products
  set stock = greatest(stock - p_quantity, 0),
      sold_count = sold_count + p_quantity
  where id = p_product_id;
end;
$$;

revoke execute on function public.decrement_product_stock(uuid, int) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. product_files: only the store owner, Super Admin, or a customer who
--    actually paid for that product can read its files. Since the storefront
--    fetches files through a join, this alone makes the download links
--    disappear from the public product page for everyone else -- no
--    front-end change needed.
-- ---------------------------------------------------------------------------
drop policy if exists "product_files_select" on public.product_files;
create policy "product_files_select" on public.product_files for select
  using (
    exists (
      select 1 from public.products p join public.stores s on s.id = p.store_id
      where p.id = product_id and (s.owner_id = auth.uid() or public.current_role() = 'super_admin')
    )
    or exists (
      select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
      where oi.product_id = product_files.product_id
        and o.customer_id = auth.uid()
        and o.payment_status = 'reussi'
    )
  );

-- ---------------------------------------------------------------------------
-- 8. promos: restrict public visibility to currently-active, in-window
--    promos (matches what listActivePromos/findActivePromoByCode should see;
--    the ILIKE-wildcard issue itself is fixed in application code).
-- ---------------------------------------------------------------------------
drop policy if exists "promos_select" on public.promos;
create policy "promos_select_active_or_owner_admin" on public.promos for select
  using (
    (active and current_date between start_date and end_date)
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- ---------------------------------------------------------------------------
-- 9. payments: this table is only ever written by trusted server code
--    (service-role key) or Super Admin -- no legitimate client insert exists,
--    unlike orders/order_items which need anon insert for guest checkout.
-- ---------------------------------------------------------------------------
drop policy if exists "payments_insert_anyone" on public.payments;
create policy "payments_insert_admin" on public.payments for insert
  with check (public.current_role() = 'super_admin');
