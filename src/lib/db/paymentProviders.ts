import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentProviderKey, PaymentProviderRow } from "./types";

export async function listPaymentProviders(supabase: SupabaseClient): Promise<PaymentProviderRow[]> {
  const { data } = await supabase.from("payment_providers").select("*").order("provider_key");
  return (data as PaymentProviderRow[]) ?? [];
}

/**
 * The vendor payment center's catalog: every provider whose country_codes[]
 * includes the store's country -- filtering happens client-side over the
 * small (< 20 row) full list rather than a Postgres array-contains query,
 * since the whole catalog is already cached by the page for the "manual
 * vs. coming soon" split.
 */
export async function listPaymentProvidersForCountry(
  supabase: SupabaseClient,
  countryCode: string
): Promise<PaymentProviderRow[]> {
  const all = await listPaymentProviders(supabase);
  return all.filter((p) => p.country_codes.includes(countryCode));
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
