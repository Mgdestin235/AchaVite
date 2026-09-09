-- Seller Payment Center: lets each vendor pick their own country, browse a
-- country-filtered catalog of payment providers, configure their account
-- details per provider, and mark one as their default -- extending the
-- simple store_payment_methods CRUD built in Phase 4 into the richer
-- "Centre de paiement" requested afterwards.
--
-- Deliberately reuses existing tables rather than creating the parallel
-- ones a generic spec for this feature would suggest:
--   - countries/currencies (0004)      -- no new "countries" table
--   - payment_providers (0004)         -- no new "payment_methods" table;
--     its country_codes[] column (added in 0004, never populated until
--     now) already *is* the "country_payment_methods" mapping
--   - store_payment_methods (0004)     -- no new "seller_payment_methods"
--     table; extended in place with the extra fields this needs
--
-- Scope confirmed with the platform owner: a store's own payment methods
-- stay informational for now -- this migration does NOT change how
-- customer-order payments/commission work. It only prepares the orders
-- columns (all inert, defaulting to the current behavior) that the next
-- phase will use to let a single-vendor cart optionally pay the seller
-- directly, with no commission on those specific orders.

-- ---------------------------------------------------------------------------
-- 1. New provider types (in addition to manual/wave/orange_money/mtn_momo/
--    moov_money/airtel_money from 0004).
-- ---------------------------------------------------------------------------
do $$ begin
  alter type payment_provider_key add value if not exists 'free_money';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type payment_provider_key add value if not exists 'tmoney';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type payment_provider_key add value if not exists 'flooz';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type payment_provider_key add value if not exists 'bank_transfer';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type payment_provider_key add value if not exists 'card';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type payment_provider_key add value if not exists 'qr';
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. More countries (Ghana, Nigeria) + a currency each.
-- ---------------------------------------------------------------------------
insert into public.currencies (code, name, symbol) values
  ('GHS', 'Cedi ghanéen', 'GH₵'),
  ('NGN', 'Naira nigérian', '₦')
on conflict (code) do nothing;

insert into public.countries (code, name, currency_code, phone_prefix) values
  ('GH', 'Ghana', 'GHS', '233'),
  ('NG', 'Nigeria', 'NGN', '234')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 3. A store belongs to one country -- determines its currency and which
--    payment providers it's offered. Nullable: existing stores (and new
--    ones before the vendor picks a country) simply see no provider
--    catalog yet, same as picking no country in the mockup.
-- ---------------------------------------------------------------------------
alter table public.stores add column if not exists country_code text references public.countries(code);

-- ---------------------------------------------------------------------------
-- 4. Provider catalog: register the new provider types (as unconfigured
--    stubs, same honesty rule as 0004 -- never presented as functional
--    until a real integration exists) and populate country_codes[] for
--    every provider so the vendor UI can filter by the store's country.
--    Coverage is illustrative of real operator footprints, editable by the
--    Super Admin afterwards from /super-admin/monetisation/prestataires.
-- ---------------------------------------------------------------------------
insert into public.payment_providers (provider_key, display_name, is_active, is_configured, notes) values
  ('free_money', 'Free Money', false, false, 'Intégration API à venir.'),
  ('tmoney', 'TMoney', false, false, 'Intégration API à venir.'),
  ('flooz', 'Flooz', false, false, 'Intégration API à venir.'),
  ('bank_transfer', 'Virement bancaire', false, false, 'Intégration API à venir.'),
  ('card', 'Carte bancaire (Visa/Mastercard)', false, false, 'Intégration API à venir -- AchaVite ne stocke jamais de données de carte.'),
  ('qr', 'Paiement QR', false, false, 'Intégration API à venir.')
on conflict (provider_key) do nothing;

update public.payment_providers set country_codes = case provider_key
  when 'manual' then array['TD','CM','CI','SN','BF','ML','NE','GN','BJ','TG','GA','CG','CD','GH','NG']
  when 'wave' then array['CI','SN']
  when 'orange_money' then array['CI','SN','ML','BF','NE','GN','CM','CD']
  when 'mtn_momo' then array['CI','BJ','CM','GH','NG','GN']
  when 'moov_money' then array['CI','BJ','TG','BF','ML','NE']
  when 'airtel_money' then array['TD','NE','GA','CG','CD']
  when 'free_money' then array['SN']
  when 'tmoney' then array['TG']
  when 'flooz' then array['BJ','TG']
  when 'bank_transfer' then array['TD','CM','CI','SN','BF','ML','NE','GN','BJ','TG','GA','CG','CD','GH','NG']
  when 'card' then array['TD','CM','CI','SN','BF','ML','NE','GN','BJ','TG','GA','CG','CD','GH','NG']
  when 'qr' then array['CI','SN','GH','NG']
  else country_codes
end;

-- ---------------------------------------------------------------------------
-- 5. Extend store_payment_methods with the fields this catalog needs
--    (account holder name, merchant/operator id, a "default" flag, and a
--    free-form metadata slot so a future provider-specific field never
--    needs another migration).
-- ---------------------------------------------------------------------------
alter table public.store_payment_methods add column if not exists account_name text;
alter table public.store_payment_methods add column if not exists merchant_id text;
alter table public.store_payment_methods add column if not exists is_default boolean not null default false;
alter table public.store_payment_methods add column if not exists metadata jsonb not null default '{}';

-- Only one default per store -- setting a new one server-side unsets any
-- previous one in the same transaction, so the client never has to (and
-- can't accidentally leave two).
create or replace function public.enforce_single_default_payment_method()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.is_default then
    update public.store_payment_methods
    set is_default = false
    where store_id = new.store_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

drop trigger if exists store_payment_methods_single_default on public.store_payment_methods;
create trigger store_payment_methods_single_default
  before insert or update on public.store_payment_methods
  for each row execute function public.enforce_single_default_payment_method();

-- ---------------------------------------------------------------------------
-- 6. Orders: columns for the next phase (single-vendor direct-to-seller
--    checkout). All inert today -- payment_mode defaults to 'platform',
--    the only value that exists anywhere yet, so every existing and new
--    order behaves exactly as before until that phase's code is shipped.
-- ---------------------------------------------------------------------------
do $$ begin
  create type order_payment_mode as enum ('platform', 'direct_to_seller');
exception when duplicate_object then null; end $$;

alter table public.orders add column if not exists payment_mode order_payment_mode not null default 'platform';
alter table public.orders add column if not exists seller_payment_method_id uuid references public.store_payment_methods(id);
alter table public.orders add column if not exists payment_reference text;
