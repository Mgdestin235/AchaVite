import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlan } from "./types";

/**
 * Used by the homepage pricing cards and the vendor upgrade/signup flow --
 * price is never hardcoded in the frontend. Despite the name, this no
 * longer filters on is_active: that flag now means "payment required for
 * this plan" (set from Super Admin > Monétisation > Plans), not
 * "visible" -- a plan always shows and is always selectable, is_active
 * only decides whether choosing it goes through payment or straight to
 * account creation (see /vendeur/offres and /api/vendeur/creer-compte).
 */
export async function getActivePlan(supabase: SupabaseClient, code: string): Promise<SubscriptionPlan | null> {
  const { data } = await supabase.from("subscription_plans").select("*").eq("code", code).maybeSingle();
  return (data as SubscriptionPlan) ?? null;
}

export async function listPlans(supabase: SupabaseClient): Promise<SubscriptionPlan[]> {
  const { data } = await supabase.from("subscription_plans").select("*").order("price");
  return (data as SubscriptionPlan[]) ?? [];
}

export async function updatePlan(
  supabase: SupabaseClient,
  planId: string,
  patch: Partial<Pick<SubscriptionPlan, "name" | "price" | "duration_days" | "features" | "is_active" | "effective_from">>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("subscription_plans").update(patch).eq("id", planId);
  return { error: error?.message ?? null };
}
