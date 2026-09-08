import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPayment, SubscriptionPaymentKind } from "./types";

/**
 * A vendor declares "I paid" for their own store. amount/currency/period are
 * always re-derived server-side from the plan row by the
 * recompute_subscription_payment() trigger -- what's sent here for those
 * fields would be ignored even if included, so this only needs the plan
 * being purchased.
 */
export async function createSubscriptionPaymentDeclaration(
  supabase: SupabaseClient,
  storeId: string,
  planId: string,
  kind: SubscriptionPaymentKind,
  reference?: string
): Promise<{ payment: SubscriptionPayment | null; error: string | null }> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .insert({ store_id: storeId, plan_id: planId, kind, reference: reference || null })
    .select("*")
    .single();
  if (error) return { payment: null, error: error.message };
  return { payment: data as SubscriptionPayment, error: null };
}

export async function listSubscriptionPaymentsForStore(
  supabase: SupabaseClient,
  storeId: string
): Promise<SubscriptionPayment[]> {
  const { data } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  return (data as SubscriptionPayment[]) ?? [];
}

export type SubscriptionPaymentWithStore = SubscriptionPayment & { stores: { name: string } | null };

/** Super Admin: every subscription payment, across all vendors. */
export async function listAllSubscriptionPayments(
  supabase: SupabaseClient,
  filter?: { status?: SubscriptionPayment["status"] }
): Promise<SubscriptionPaymentWithStore[]> {
  let query = supabase
    .from("subscription_payments")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data } = await query;
  return (data as unknown as SubscriptionPaymentWithStore[]) ?? [];
}

/** Super Admin only (enforced by the confirm_subscription_payment() RPC itself). */
export async function confirmSubscriptionPayment(
  supabase: SupabaseClient,
  paymentId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("confirm_subscription_payment", { p_payment_id: paymentId });
  return { error: error?.message ?? null };
}

export type RevenueSummary = {
  totalTrial: number;
  totalPro: number;
  today: number;
  last7Days: number;
  last30Days: number;
  thisYear: number;
  successCount: number;
  failedCount: number;
};

/** Backs the Super Admin Finances/Revenus dashboard. Aggregated client-side over successful payments -- fine at this scale. */
export async function getRevenueSummary(supabase: SupabaseClient): Promise<RevenueSummary> {
  const { data } = await supabase
    .from("subscription_payments")
    .select("amount, kind, status, created_at");
  const rows = (data as { amount: number; kind: string; status: string; created_at: string }[]) ?? [];

  const now = Date.now();
  const day = 86400000;
  const success = rows.filter((r) => r.status === "success");
  const sum = (list: typeof rows) => list.reduce((s, r) => s + Number(r.amount), 0);

  return {
    totalTrial: sum(success.filter((r) => r.kind === "trial")),
    totalPro: sum(success.filter((r) => r.kind === "pro_subscription" || r.kind === "renewal")),
    today: sum(success.filter((r) => now - Date.parse(r.created_at) < day)),
    last7Days: sum(success.filter((r) => now - Date.parse(r.created_at) < 7 * day)),
    last30Days: sum(success.filter((r) => now - Date.parse(r.created_at) < 30 * day)),
    thisYear: sum(success.filter((r) => new Date(r.created_at).getFullYear() === new Date().getFullYear())),
    successCount: success.length,
    failedCount: rows.filter((r) => r.status === "failed").length,
  };
}
