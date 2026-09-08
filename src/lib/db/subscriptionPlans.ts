import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlan } from "./types";

/** Used by the homepage pricing cards and the vendor upgrade flow -- price is never hardcoded in the frontend. */
export async function getActivePlan(supabase: SupabaseClient, code: string): Promise<SubscriptionPlan | null> {
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
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
