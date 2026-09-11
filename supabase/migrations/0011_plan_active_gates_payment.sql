-- Re-purposes subscription_plans.is_active: it used to mean "visible at
-- all" (0005's M-04); it now means "payment required for this plan" per
-- the owner's explicit request. A plan with is_active=false must still be
-- readable by anyone (so the offer keeps showing on /vendeur/offres and
-- the homepage, just free), so the SELECT policy can no longer filter on
-- it -- this table has no other reason to be hidden.
drop policy if exists "subscription_plans_select" on public.subscription_plans;
create policy "subscription_plans_select" on public.subscription_plans for select
  using (true);
