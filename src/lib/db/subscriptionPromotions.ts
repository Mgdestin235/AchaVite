import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPromotion } from "./types";

// Mirrors migration 0004_monetization.sql — subscription_promotions

export type SubscriptionPromotionInput = {
  code: string;
  plan_id: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  starts_at: string;
  ends_at: string;
  max_uses: number;
};

export async function listSubscriptionPromotions(supabase: SupabaseClient): Promise<SubscriptionPromotion[]> {
  const { data } = await supabase.from("subscription_promotions").select("*").order("starts_at", { ascending: false });
  return (data as SubscriptionPromotion[]) ?? [];
}

export async function createSubscriptionPromotion(
  supabase: SupabaseClient,
  input: SubscriptionPromotionInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("subscription_promotions").insert(input);
  return { error: error?.message ?? null };
}

export async function updateSubscriptionPromotionActive(
  supabase: SupabaseClient,
  id: string,
  active: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("subscription_promotions").update({ active }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteSubscriptionPromotion(supabase: SupabaseClient, id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("subscription_promotions").delete().eq("id", id);
  return { error: error?.message ?? null };
}
