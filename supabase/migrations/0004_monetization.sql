-- Monetization: vendor trial + PRO subscriptions billed to the platform,
-- platform-wide and per-vendor payment methods, multi-country config,
-- invoicing, and audit logging.
--
-- Two money flows stay architecturally separate, per explicit product
-- requirement: (A) vendor -> platform (this migration: subscriptions,
-- subscription_payments, invoices) never touches (B) customer -> vendor
-- (orders/order_items/payments, already governed by 0001+0003). Nothing
-- here reads or writes orders/order_items/payments/platform_settings.
--
-- Same anti-tampering posture as 0003_security_hardening.sql: every money
-- or status field is re-derived server-side (trigger or a security definer
-- function), never trusted from client input.
--
-- No real payment gateway account exists yet -- trial/PRO payments reuse
-- the same manual WhatsApp-confirmation + Super Admin validation pattern
-- already used for customer orders. The provider_key enum and
-- payment_providers table exist so a real gateway can be wired in later
-- (see src/lib/payments/) without another schema change.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type subscription_status as enum (
    'trial_pending', 'trial_active', 'trial_expired',
    'pro_active', 'pro_expired',
    'payment_pending', 'payment_failed',
    'suspended', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_payment_kind as enum ('trial', 'pro_subscription', 'renewal', 'refund');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_payment_status as enum ('pending', 'success', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider_key as enum ('manual', 'wave', 'orange_money', 'mtn_momo', 'moov_money', 'airtel_money');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Countries / currencies
-- ---------------------------------------------------------------------------
create table if not exists public.currencies (
  code text primary key,
  name text not null,
  symbol text not null
);

insert into public.currencies (code, name, symbol) values
  ('XOF', 'Franc CFA (UEMOA)', 'FCFA'),
  ('XAF', 'Franc CFA (CEMAC)', 'FCFA'),
  ('CDF', 'Franc congolais', 'FC'),
  ('GNF', 'Franc guinéen', 'FG')
on conflict (code) do nothing;

create table if not exists public.countries (
  code text primary key,
  name text not null,
  currency_code text not null references public.currencies(code),
  phone_prefix text not null,
  is_active boolean not null default true
);

insert into public.countries (code, name, currency_code, phone_prefix) values
  ('TD', 'Tchad', 'XAF', '235'),
  ('CM', 'Cameroun', 'XAF', '237'),
  ('CI', 'Côte d''Ivoire', 'XOF', '225'),
  ('SN', 'Sénégal', 'XOF', '221'),
  ('BF', 'Burkina Faso', 'XOF', '226'),
  ('ML', 'Mali', 'XOF', '223'),
  ('NE', 'Niger', 'XOF', '227'),
  ('GN', 'Guinée', 'GNF', '224'),
  ('BJ', 'Bénin', 'XOF', '229'),
  ('TG', 'Togo', 'XOF', '228'),
  ('GA', 'Gabon', 'XAF', '241'),
  ('CG', 'Congo', 'XAF', '242'),
  ('CD', 'RD Congo', 'CDF', '243')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Payment providers (metadata only -- real charge logic lives in
-- src/lib/payments/; this table just tracks what's active/configured so
-- the admin can toggle visibility without a code change).
-- ---------------------------------------------------------------------------
create table if not exists public.payment_providers (
  provider_key payment_provider_key primary key,
  display_name text not null,
  is_active boolean not null default false,
  is_configured boolean not null default false,
  country_codes text[] not null default '{}',
  notes text
);

insert into public.payment_providers (provider_key, display_name, is_active, is_configured, notes) values
  ('manual', 'Confirmation manuelle (WhatsApp)', true, true, 'Flux actif : le vendeur paie puis confirme sur WhatsApp, validé manuellement par le Super Admin.'),
  ('wave', 'Wave', false, false, 'Intégration API à venir.'),
  ('orange_money', 'Orange Money', false, false, 'Intégration API à venir.'),
  ('mtn_momo', 'MTN Mobile Money', false, false, 'Intégration API à venir.'),
  ('moov_money', 'Moov Money', false, false, 'Intégration API à venir.'),
  ('airtel_money', 'Airtel Money', false, false, 'Intégration API à venir.')
on conflict (provider_key) do nothing;

-- ---------------------------------------------------------------------------
-- Platform's own payment methods for collecting SUBSCRIPTION fees (distinct
-- from platform_settings' mtn/airtel/moov/bank columns, which remain the
-- customer-order payment flow -- see 0001 lines ~316-325). Rows, not fixed
-- columns, so the admin can add a method without a migration.
-- ---------------------------------------------------------------------------
create table if not exists public.platform_payment_methods (
  id uuid primary key default gen_random_uuid(),
  country_code text references public.countries(code),
  provider_key payment_provider_key not null references public.payment_providers(provider_key),
  label text not null,
  number text,
  payment_link text,
  beneficiary_name text,
  currency_code text not null references public.currencies(code),
  instructions text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_payment_methods_country_idx on public.platform_payment_methods(country_code);

insert into public.platform_payment_methods (country_code, provider_key, label, number, payment_link, beneficiary_name, currency_code, instructions)
select 'CI', 'wave', 'Wave', '+225 07 88 72 95 24', 'https://pay.wave.com/m/M_ci_OO24ILn7wQ3d/c/ci/', 'AchaVite', 'XOF',
  'Payez via le lien Wave ou envoyez le montant au numéro indiqué, puis confirmez sur WhatsApp.'
where not exists (select 1 from public.platform_payment_methods where provider_key = 'wave' and country_code = 'CI');

insert into public.platform_payment_methods (country_code, provider_key, label, number, beneficiary_name, currency_code, instructions)
select 'CI', 'orange_money', 'Orange Money', '+225 07 88 72 95 24', 'AchaVite', 'XOF',
  'Envoyez le montant au numéro Orange Money indiqué, puis confirmez sur WhatsApp.'
where not exists (select 1 from public.platform_payment_methods where provider_key = 'orange_money' and country_code = 'CI');

-- ---------------------------------------------------------------------------
-- Subscription plans (admin-configurable price/duration/features -- never
-- hardcoded in the frontend) and promotions.
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price numeric(12,2) not null,
  currency_code text not null references public.currencies(code),
  duration_days int not null,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans (code, name, price, currency_code, duration_days, features) values
  ('trial', 'Essai gratuit', 5500, 'XOF', 90,
   '["Boutique en ligne", "Ajout de produits illimité", "Réception de commandes", "Support standard"]'),
  ('pro_monthly', 'AchaVite PRO', 15000, 'XOF', 30,
   '["Tout l''essai", "Mise en avant dans le catalogue", "Statistiques avancées", "Support prioritaire"]')
on conflict (code) do nothing;

create table if not exists public.subscription_promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan_id uuid references public.subscription_plans(id),
  discount_percent numeric(5,2),
  discount_amount numeric(12,2),
  starts_at date not null,
  ends_at date not null,
  max_uses int not null default 0,
  used int not null default 0,
  active boolean not null default true,
  check (discount_percent is not null or discount_amount is not null)
);

-- ---------------------------------------------------------------------------
-- Subscriptions -- one row per store, current state. History lives in
-- subscription_payments, not here.
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id),
  status subscription_status not null default 'trial_pending',
  trial_activated_at timestamptz,
  trial_expires_at timestamptz,
  pro_activated_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_reminder_sent_days int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every store gets a trial_pending subscription row automatically.
create or replace function public.create_subscription_for_new_store()
returns trigger
language plpgsql
security definer
set search_path = public
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

drop trigger if exists stores_create_subscription on public.stores;
create trigger stores_create_subscription
  after insert on public.stores
  for each row execute function public.create_subscription_for_new_store();

-- Backfill: stores created before this migration existed.
insert into public.subscriptions (store_id, plan_id, status)
select s.id, (select id from public.subscription_plans where code = 'trial'), 'trial_pending'
from public.stores s
where not exists (select 1 from public.subscriptions sub where sub.store_id = s.id);

-- ---------------------------------------------------------------------------
-- Subscription payments (trial fee / PRO subscription / renewal / refund).
-- amount/currency/period are always re-derived from subscription_plans,
-- never trusted from the client -- same posture as recompute_order_item()
-- in 0003_security_hardening.sql.
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id),
  plan_id uuid not null references public.subscription_plans(id),
  kind subscription_payment_kind not null,
  amount numeric(12,2) not null default 0,
  currency_code text not null default 'XOF' references public.currencies(code),
  provider_key payment_provider_key not null default 'manual',
  status subscription_payment_status not null default 'pending',
  period_start date,
  period_end date,
  reference text,
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists subscription_payments_store_idx on public.subscription_payments(store_id);

create or replace function public.recompute_subscription_payment()
returns trigger
language plpgsql
security definer
set search_path = public
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

  select * into v_sub from public.subscriptions where store_id = new.store_id;
  if v_sub is null then
    raise exception 'Abonnement introuvable pour cette boutique';
  end if;
  new.subscription_id := v_sub.id;

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

drop trigger if exists subscription_payments_recompute on public.subscription_payments;
create trigger subscription_payments_recompute
  before insert on public.subscription_payments
  for each row execute function public.recompute_subscription_payment();

-- ---------------------------------------------------------------------------
-- Invoices -- generated only by confirm_subscription_payment(), never
-- inserted directly by a client.
-- ---------------------------------------------------------------------------
create sequence if not exists public.invoice_number_seq;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  subscription_payment_id uuid not null unique references public.subscription_payments(id),
  store_id uuid not null references public.stores(id) on delete cascade,
  amount numeric(12,2) not null,
  currency_code text not null references public.currencies(code),
  period_start date,
  period_end date,
  status subscription_payment_status not null,
  pdf_url text,
  created_at timestamptz not null default now()
);
create index if not exists invoices_store_idx on public.invoices(store_id);

-- ---------------------------------------------------------------------------
-- Confirms a pending subscription payment -- Super Admin only. Mirrors the
-- manual "valider le paiement" action already used for customer orders in
-- /super-admin/orders, but wrapped in one atomic function so the payment
-- row, the subscription row, and the invoice can never drift out of sync.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_subscription_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
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

  select * into v_payment from public.subscription_payments where id = p_payment_id and status = 'pending';
  if v_payment is null then
    raise exception 'Paiement introuvable ou déjà traité';
  end if;

  update public.subscription_payments
  set status = 'success', confirmed_by = auth.uid(), confirmed_at = now()
  where id = p_payment_id;

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
    -- Extend from the current period end (not "now"), so a renewal made
    -- before expiry doesn't forfeit already-paid days.
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

grant execute on function public.confirm_subscription_payment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Vendor's own payment methods -- NEW: buyers see these on the store page.
-- Distinct from platform_payment_methods (platform collecting subscription
-- fees) and from platform_settings (platform collecting order payments).
-- ---------------------------------------------------------------------------
create table if not exists public.store_payment_methods (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider_key payment_provider_key not null,
  label text not null,
  number text,
  instructions text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists store_payment_methods_store_idx on public.store_payment_methods(store_id);

-- ---------------------------------------------------------------------------
-- Audit logs -- write-only via security definer functions / the
-- service-role key, never by a direct client insert.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications: extend the existing (previously unused) table so
-- subscription reminders can be typed and deduplicated.
-- ---------------------------------------------------------------------------
alter table public.notifications add column if not exists kind text not null default 'generic';
alter table public.notifications add column if not exists metadata jsonb not null default '{}';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.currencies enable row level security;
alter table public.countries enable row level security;
alter table public.payment_providers enable row level security;
alter table public.platform_payment_methods enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscription_promotions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.invoices enable row level security;
alter table public.store_payment_methods enable row level security;
alter table public.audit_logs enable row level security;

-- Reference/config data: public read (needed for homepage pricing cards and
-- buyer-facing payment method display), Super Admin-only write.
create policy "currencies_select_all" on public.currencies for select using (true);
create policy "currencies_write_admin" on public.currencies for all
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create policy "countries_select_all" on public.countries for select using (true);
create policy "countries_write_admin" on public.countries for all
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create policy "payment_providers_select_all" on public.payment_providers for select using (true);
create policy "payment_providers_write_admin" on public.payment_providers for all
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create policy "platform_payment_methods_select" on public.platform_payment_methods for select
  using (is_active or public.current_role() = 'super_admin');
create policy "platform_payment_methods_write_admin" on public.platform_payment_methods for all
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create policy "subscription_plans_select" on public.subscription_plans for select
  using (is_active or public.current_role() in ('super_admin', 'vendor'));
create policy "subscription_plans_write_admin" on public.subscription_plans for all
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

create policy "subscription_promotions_select" on public.subscription_promotions for select
  using (active or public.current_role() = 'super_admin');
create policy "subscription_promotions_write_admin" on public.subscription_promotions for all
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

-- subscriptions: the owning vendor or Super Admin can read; only Super Admin
-- (or the confirm_subscription_payment() security definer function, which
-- bypasses RLS as the table owner) can write. No client insert policy --
-- rows are only ever created by the stores_create_subscription trigger.
create policy "subscriptions_select" on public.subscriptions for select
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );
create policy "subscriptions_update_admin" on public.subscriptions for update
  using (public.current_role() = 'super_admin') with check (public.current_role() = 'super_admin');

-- subscription_payments: the vendor can declare a payment for their own
-- store (always inserted as 'pending' -- the trigger above forces this
-- regardless of what's sent), and read their own history; only
-- confirm_subscription_payment() can mark one 'success'.
create policy "subscription_payments_select" on public.subscription_payments for select
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );
create policy "subscription_payments_insert_owner" on public.subscription_payments for insert
  with check (
    status = 'pending'
    and exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

-- invoices: read-only for the owning vendor or Super Admin; never written
-- directly by a client (only by confirm_subscription_payment()).
create policy "invoices_select" on public.invoices for select
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- store_payment_methods: buyers see active rows for any store; the owning
-- vendor manages all of their own (including inactive ones); Super Admin
-- manages all.
create policy "store_payment_methods_select" on public.store_payment_methods for select
  using (
    is_active
    or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );
create policy "store_payment_methods_write" on public.store_payment_methods for all
  using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  )
  with check (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
    or public.current_role() = 'super_admin'
  );

-- audit_logs: Super Admin read-only. No client insert/update/delete policy
-- at all -- only security definer functions (table owner) write here.
create policy "audit_logs_select_admin" on public.audit_logs for select
  using (public.current_role() = 'super_admin');
