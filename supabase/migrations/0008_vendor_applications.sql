-- Paid vendor onboarding: a visitor pays the Free (5 500 FCFA / 3 months)
-- or Pro (15 000 FCFA / month) fee BEFORE any account exists. There is no
-- automated payment gateway, so the Super Admin confirms the payment
-- manually and hands the applicant a one-time access code (over WhatsApp);
-- only that code unlocks the "create my vendor account" form.
--
-- No account, no store and no subscription is created until the account
-- form is submitted with a confirmed, unconsumed code -- enforced
-- server-side in /api/vendeur/creer-compte with the service-role client.

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  plan_code text not null,                 -- 'trial' | 'pro_monthly'
  amount numeric(12,2) not null default 0,
  currency_code text not null default 'XOF',
  reference text,                           -- payment ref the applicant typed
  status text not null default 'pending',  -- 'pending' | 'confirmed' | 'consumed' | 'rejected'
  access_code text unique,                  -- generated when confirmed
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  store_id uuid references public.stores(id) on delete set null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vendor_applications_status_idx on public.vendor_applications(status);

alter table public.vendor_applications enable row level security;

-- Anyone (an anonymous visitor) can declare a payment, but only as a fresh
-- 'pending' row with no code and no linked store -- everything else is set
-- later by the Super Admin or the server.
drop policy if exists "vendor_applications_insert_public" on public.vendor_applications;
create policy "vendor_applications_insert_public" on public.vendor_applications for insert
  with check (
    status = 'pending'
    and access_code is null
    and store_id is null
    and confirmed_by is null
    and consumed_at is null
  );

-- Reading applications (emails, phones, codes) is Super Admin only. The
-- applicant never needs to read the row back -- the code reaches them
-- out of band.
drop policy if exists "vendor_applications_select_admin" on public.vendor_applications;
create policy "vendor_applications_select_admin" on public.vendor_applications for select
  using (public.current_role() = 'super_admin');

-- Only the Super Admin confirms/rejects from the dashboard. The account-
-- creation server route uses the service-role key, which bypasses RLS, to
-- mark a row consumed.
drop policy if exists "vendor_applications_update_admin" on public.vendor_applications;
create policy "vendor_applications_update_admin" on public.vendor_applications for update
  using (public.current_role() = 'super_admin')
  with check (public.current_role() = 'super_admin');
