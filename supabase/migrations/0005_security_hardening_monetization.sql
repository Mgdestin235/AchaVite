-- Security hardening for the monetization system (0004), following the
-- security + QA audit run after Phases 1-7 shipped. Closes the paths that
-- let a vendor bypass paying entirely via direct PostgREST calls, and a
-- handful of lower-severity RLS/config gaps found alongside it.
--
-- Written idempotently (drop policy if exists / create or replace) so a
-- second accidental run (as happened with 0004 via the dashboard SQL
-- editor) is harmless.
--
-- Explicitly OUT OF SCOPE, by the owner's repeated, explicit choice: making
-- an expired/suspended vendor's products disappear from the public catalog,
-- or blocking buyers from ordering from them. Enforcement stays scoped to
-- the vendor's OWN write access (adding/editing products, promos, etc.) --
-- exactly what "portail vendeur uniquement" was meant to guarantee, now
-- actually enforced server-side instead of only by a Next.js redirect.

-- ---------------------------------------------------------------------------
-- 1. store_has_active_subscription() -- the single source of truth for
--    "can this store's owner currently perform vendor write actions".
--    Same live-date check as computeSubscriptionStatus() on the TypeScript
--    side, so it's correct even before the daily cron has run today.
-- ---------------------------------------------------------------------------
create or replace function public.store_has_active_subscription(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.store_id = p_store_id
      and (
        (s.status = 'trial_active' and s.trial_expires_at > now())
        or (s.status = 'pro_active' and s.current_period_end > now())
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Gate vendor WRITE access on the subscription check (H-01). Read/public
--    policies (products_select_public, promos_select, etc.) are untouched --
--    buyers see and order exactly as before.
-- ---------------------------------------------------------------------------
drop policy if exists "products_write_owner_or_admin" on public.products;
create policy "products_write_owner_or_admin" on public.products for all
  using (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  )
  with check (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  );

drop policy if exists "product_images_write" on public.product_images;
create policy "product_images_write" on public.product_images for all
  using (exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = product_id
      and ((s.owner_id = auth.uid() and public.store_has_active_subscription(s.id)) or public.current_role() = 'super_admin')
  ));

drop policy if exists "product_files_write" on public.product_files;
create policy "product_files_write" on public.product_files for all
  using (exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = product_id
      and ((s.owner_id = auth.uid() and public.store_has_active_subscription(s.id)) or public.current_role() = 'super_admin')
  ));

drop policy if exists "delivery_zones_write" on public.delivery_zones;
create policy "delivery_zones_write" on public.delivery_zones for all
  using (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  );

drop policy if exists "promos_write" on public.promos;
create policy "promos_write" on public.promos for all
  using (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  );

-- order_items: a vendor whose subscription lapsed keeps read access (they
-- can still see past orders per the product spec) but can no longer update
-- item status/fulfillment -- consistent with the portal redirect that
-- already hides /admin/commandes from them.
drop policy if exists "order_items_update_store_or_admin" on public.order_items;
create policy "order_items_update_store_or_admin" on public.order_items for update
  using (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  );

-- store_payment_methods: same gate on vendor writes (a lapsed vendor
-- shouldn't be able to change where buyers send them money either).
drop policy if exists "store_payment_methods_write" on public.store_payment_methods;
create policy "store_payment_methods_write" on public.store_payment_methods for all
  using (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  )
  with check (
    (exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
     and public.store_has_active_subscription(store_id))
    or public.current_role() = 'super_admin'
  );

-- ---------------------------------------------------------------------------
-- 3. recompute_subscription_payment(): kind is now fully re-derived from
--    the plan + subscription history, never trusted from the client (H-02).
--    Closes both "PRO at trial price" and "replay the trial forever", and
--    makes kind='refund' unreachable through this client-facing insert path
--    entirely (a real refund flow would need its own super_admin-only
--    function, which doesn't exist yet -- there is no refund UI today).
-- ---------------------------------------------------------------------------
create or replace function public.recompute_subscription_payment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan record;
  v_sub record;
  v_period_start date;
begin
  select * into v_plan from public.subscription_plans where id = new.plan_id;
  if v_plan is null then
    raise exception 'Offre introuvable';
  end if;
  if not v_plan.is_active then
    raise exception 'Cette offre n''est plus disponible';
  end if;

  select * into v_sub from public.subscriptions where store_id = new.store_id;
  if v_sub is null then
    raise exception 'Abonnement introuvable pour cette boutique';
  end if;
  new.subscription_id := v_sub.id;

  if v_plan.code = 'trial' then
    if v_sub.trial_activated_at is not null then
      raise exception 'L''essai a déjà été utilisé pour cette boutique -- passez au plan PRO';
    end if;
    new.kind := 'trial';
  else
    new.kind := case when v_sub.pro_activated_at is null then 'pro_subscription' else 'renewal' end;
  end if;

  new.amount := v_plan.price;
  new.currency_code := v_plan.currency_code;
  new.status := 'pending';
  new.confirmed_by := null;
  new.confirmed_at := null;

  if new.kind = 'trial' then
    v_period_start := current_date;
  else
    v_period_start := greatest(coalesce(v_sub.current_period_end::date, current_date), current_date);
  end if;
  new.period_start := v_period_start;
  new.period_end := v_period_start + (v_plan.duration_days || ' days')::interval;

  return new;
end;
$$;

-- Only one undecided declaration per store at a time (M-04 / MON-008): a
-- vendor can't stack duplicate "I paid" declarations the admin might both
-- accidentally confirm.
create unique index if not exists subscription_payments_one_pending_per_store
  on public.subscription_payments(store_id) where status = 'pending';

-- ---------------------------------------------------------------------------
-- 4. confirm_subscription_payment(): explicit row lock + re-checked status
--    on the update (defense in depth -- the invoices unique constraint
--    already prevented double-crediting, this removes the reliance on that
--    side effect). search_path hardened with pg_temp (L-03).
-- ---------------------------------------------------------------------------
create or replace function public.confirm_subscription_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment record;
  v_sub record;
  v_plan record;
  v_new_period_end timestamptz;
  v_invoice_number text;
begin
  if public.current_role() <> 'super_admin' then
    raise exception 'Non autorisé';
  end if;

  select * into v_payment from public.subscription_payments where id = p_payment_id and status = 'pending' for update;
  if v_payment is null then
    raise exception 'Paiement introuvable ou déjà traité';
  end if;

  update public.subscription_payments
  set status = 'success', confirmed_by = auth.uid(), confirmed_at = now()
  where id = p_payment_id and status = 'pending';
  if not found then
    raise exception 'Paiement introuvable ou déjà traité';
  end if;

  select * into v_sub from public.subscriptions where id = v_payment.subscription_id;
  select * into v_plan from public.subscription_plans where id = v_payment.plan_id;

  if v_payment.kind = 'trial' then
    update public.subscriptions
    set status = 'trial_active',
        plan_id = v_payment.plan_id,
        trial_activated_at = now(),
        trial_expires_at = now() + (v_plan.duration_days || ' days')::interval,
        updated_at = now()
    where id = v_sub.id;
  else
    v_new_period_end := greatest(coalesce(v_sub.current_period_end, now()), now()) + (v_plan.duration_days || ' days')::interval;
    update public.subscriptions
    set status = 'pro_active',
        plan_id = v_payment.plan_id,
        pro_activated_at = coalesce(v_sub.pro_activated_at, now()),
        current_period_end = v_new_period_end,
        cancel_at_period_end = false,
        updated_at = now()
    where id = v_sub.id;
  end if;

  v_invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
  insert into public.invoices (invoice_number, subscription_payment_id, store_id, amount, currency_code, period_start, period_end, status)
  values (v_invoice_number, v_payment.id, v_payment.store_id, v_payment.amount, v_payment.currency_code, v_payment.period_start, v_payment.period_end, 'success');

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'confirm_subscription_payment', 'subscription_payments', p_payment_id,
    jsonb_build_object('subscription_id', v_sub.id, 'kind', v_payment.kind, 'store_id', v_payment.store_id)
  );
end;
$$;

revoke execute on function public.confirm_subscription_payment(uuid) from public, anon;
grant execute on function public.confirm_subscription_payment(uuid) to authenticated;

create or replace function public.create_subscription_for_new_store()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trial_plan_id uuid;
begin
  select id into v_trial_plan_id from public.subscription_plans where code = 'trial';
  insert into public.subscriptions (store_id, plan_id, status)
  values (new.id, v_trial_plan_id, 'trial_pending')
  on conflict (store_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Data-exposure fixes (M-02, L-06, M-07, L-08b): tighten public/anon
--    read access to what buyers/vendors actually need.
-- ---------------------------------------------------------------------------

-- Vendor payment numbers: only for approved stores (was readable for
-- pending/rejected/suspended ones too), never as an unfiltered global list
-- an anonymous caller would think to request.
drop policy if exists "store_payment_methods_select" on public.store_payment_methods;
create policy "store_payment_methods_select" on public.store_payment_methods for select
  using (
    (is_active and exists (select 1 from public.stores s where s.id = store_id and s.status = 'approved'))
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- Platform's own collection numbers (Wave/Orange for subscription fees):
-- only needed by a signed-in vendor on the payment page, not the public.
drop policy if exists "platform_payment_methods_select" on public.platform_payment_methods;
create policy "platform_payment_methods_select" on public.platform_payment_methods for select
  using (
    (is_active and auth.role() = 'authenticated')
    or public.current_role() = 'super_admin'
  );

-- Promo codes: not yet actually applied anywhere in the payment flow (the
-- trigger never reads this table), so there is no legitimate reason for
-- them to be publicly enumerable yet. Super-admin-only until the discount
-- is wired into recompute_subscription_payment().
drop policy if exists "subscription_promotions_select" on public.subscription_promotions;
create policy "subscription_promotions_select" on public.subscription_promotions for select
  using (public.current_role() = 'super_admin');

-- Inactive/retired plans (draft pricing, old offers) shouldn't be visible
-- to vendors, only to the admin preparing them.
drop policy if exists "subscription_plans_select" on public.subscription_plans;
create policy "subscription_plans_select" on public.subscription_plans for select
  using (is_active or public.current_role() = 'super_admin');

-- A vendor could self-insert fake notifications (e.g. "Abonnement PRO
-- activé") since notifications_insert_admin allowed user_id = auth.uid().
-- Inserts are now super_admin/service-role only; a user may still mark
-- their own notifications read.
drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin" on public.notifications for insert
  with check (public.current_role() = 'super_admin');

-- A provider can never be switched on while still unconfigured, even via a
-- direct PostgREST call bypassing the admin UI's own check.
alter table public.payment_providers drop constraint if exists payment_providers_active_requires_configured;
alter table public.payment_providers add constraint payment_providers_active_requires_configured
  check (not is_active or is_configured);

-- ---------------------------------------------------------------------------
-- 6. Lightweight audit trail on the monetization tables an admin can edit
--    directly (M-03) -- reuses the existing audit_logs table and the
--    already-built listAuditLogs() helper, no new table needed.
-- ---------------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entity_id text;
begin
  v_entity_id := coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id',
                          to_jsonb(new)->>'provider_key', to_jsonb(old)->>'provider_key',
                          to_jsonb(new)->>'code', to_jsonb(old)->>'code');
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    lower(tg_op) || '.' || tg_table_name,
    tg_table_name,
    null,
    jsonb_build_object('key', v_entity_id, 'old', to_jsonb(old), 'new', to_jsonb(new))
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_platform_payment_methods on public.platform_payment_methods;
create trigger audit_platform_payment_methods
  after insert or update or delete on public.platform_payment_methods
  for each row execute function public.audit_row_change();

drop trigger if exists audit_subscription_plans on public.subscription_plans;
create trigger audit_subscription_plans
  after insert or update or delete on public.subscription_plans
  for each row execute function public.audit_row_change();

drop trigger if exists audit_payment_providers on public.payment_providers;
create trigger audit_payment_providers
  after insert or update or delete on public.payment_providers
  for each row execute function public.audit_row_change();

drop trigger if exists audit_subscriptions on public.subscriptions;
create trigger audit_subscriptions
  after update on public.subscriptions
  for each row execute function public.audit_row_change();
