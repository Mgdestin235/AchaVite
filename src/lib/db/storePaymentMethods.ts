import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentProviderKey, StorePaymentMethod } from "./types";

/** A vendor's own payment methods -- shown to buyers on the store/product page. */
export async function listStorePaymentMethods(
  supabase: SupabaseClient,
  storeId: string,
  filter?: { activeOnly?: boolean }
): Promise<StorePaymentMethod[]> {
  let query = supabase.from("store_payment_methods").select("*").eq("store_id", storeId).order("sort_order");
  if (filter?.activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data as StorePaymentMethod[]) ?? [];
}

export type StorePaymentMethodInput = {
  providerKey: PaymentProviderKey;
  label: string;
  number?: string;
  instructions?: string;
};

export async function createStorePaymentMethod(
  supabase: SupabaseClient,
  storeId: string,
  input: StorePaymentMethodInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("store_payment_methods").insert({
    store_id: storeId,
    provider_key: input.providerKey,
    label: input.label,
    number: input.number || null,
    instructions: input.instructions || null,
  });
  return { error: error?.message ?? null };
}

export async function updateStorePaymentMethod(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<StorePaymentMethod, "label" | "number" | "instructions" | "is_active" | "sort_order">>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("store_payment_methods").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteStorePaymentMethod(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("store_payment_methods").delete().eq("id", id);
  return { error: error?.message ?? null };
}
