import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentProviderKey, PaymentProviderRow } from "./types";

export async function listPaymentProviders(supabase: SupabaseClient): Promise<PaymentProviderRow[]> {
  const { data } = await supabase.from("payment_providers").select("*").order("provider_key");
  return (data as PaymentProviderRow[]) ?? [];
}

/** Toggles visibility only -- real charge logic lives in src/lib/payments/, not here. */
export async function setPaymentProviderActive(
  supabase: SupabaseClient,
  providerKey: PaymentProviderKey,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("payment_providers").update({ is_active: isActive }).eq("provider_key", providerKey);
  return { error: error?.message ?? null };
}
