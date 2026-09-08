import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subscription, SubscriptionStatus } from "./types";

export async function getSubscriptionByStore(
  supabase: SupabaseClient,
  storeId: string
): Promise<Subscription | null> {
  const { data } = await supabase.from("subscriptions").select("*").eq("store_id", storeId).maybeSingle();
  return (data as Subscription) ?? null;
}

export async function listSubscriptions(
  supabase: SupabaseClient,
  filter?: { status?: SubscriptionStatus }
): Promise<Subscription[]> {
  let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data } = await query;
  return (data as Subscription[]) ?? [];
}

/** Used by the daily reminder cron: every trial_active/pro_active subscription, regardless of how close to expiry. */
export async function listActiveSubscriptions(supabase: SupabaseClient): Promise<Subscription[]> {
  const { data } = await supabase.from("subscriptions").select("*").in("status", ["trial_active", "pro_active"]);
  return (data as Subscription[]) ?? [];
}

/** Super Admin only (enforced by RLS): suspend, cancel, or reactivate a subscription directly. */
export async function setSubscriptionStatus(
  supabase: SupabaseClient,
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("subscriptions").update({ status }).eq("id", subscriptionId);
  return { error: error?.message ?? null };
}
