-- subscription_plans.is_active changed meaning (see "Actif on a plan now
-- gates whether payment is required at signup"): it used to mean "visible",
-- now it means "payment required for this plan". The RLS policy from 0005
-- was never updated for that -- it still hides a plan entirely from an
-- anonymous visitor once is_active is false, so /vendeur/offres silently
-- couldn't read a "free" plan at all (getActivePlan() came back null and
-- the page fell back to its fail-safe "payment required" default). A plan
-- must always be readable regardless of is_active now.
drop policy if exists "subscription_plans_select" on public.subscription_plans;
create policy "subscription_plans_select" on public.subscription_plans for select using (true);
