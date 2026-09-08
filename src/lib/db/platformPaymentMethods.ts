import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentProviderKey, PlatformPaymentMethod } from "./types";

/** Platform's own payment methods for collecting SUBSCRIPTION fees (trial/PRO) -- distinct from platform_settings, which governs customer-order payment. */
export async function listPlatformPaymentMethods(
  supabase: SupabaseClient,
  filter?: { countryCode?: string; activeOnly?: boolean }
): Promise<PlatformPaymentMethod[]> {
  let query = supabase.from("platform_payment_methods").select("*").order("sort_order");
  if (filter?.countryCode) query = query.eq("country_code", filter.countryCode);
  if (filter?.activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data as PlatformPaymentMethod[]) ?? [];
}

export type PlatformPaymentMethodInput = {
  countryCode: string | null;
  providerKey: PaymentProviderKey;
  label: string;
  number?: string;
  paymentLink?: string;
  beneficiaryName?: string;
  currencyCode: string;
  instructions?: string;
};

export async function createPlatformPaymentMethod(
  supabase: SupabaseClient,
  input: PlatformPaymentMethodInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("platform_payment_methods").insert({
    country_code: input.countryCode,
    provider_key: input.providerKey,
    label: input.label,
    number: input.number || null,
    payment_link: input.paymentLink || null,
    beneficiary_name: input.beneficiaryName || null,
    currency_code: input.currencyCode,
    instructions: input.instructions || null,
  });
  return { error: error?.message ?? null };
}

export async function updatePlatformPaymentMethod(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<PlatformPaymentMethod>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("platform_payment_methods").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deletePlatformPaymentMethod(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("platform_payment_methods").delete().eq("id", id);
  return { error: error?.message ?? null };
}
