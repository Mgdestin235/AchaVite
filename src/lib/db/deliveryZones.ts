import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeliveryZoneRow } from "./types";

export async function listVendorZones(supabase: SupabaseClient, storeId: string): Promise<DeliveryZoneRow[]> {
  const { data } = await supabase.from("delivery_zones").select("*").eq("store_id", storeId).order("city");
  return (data as DeliveryZoneRow[]) ?? [];
}

/** Used at checkout: a multi-vendor cart needs each represented store's own zone config. */
export async function listZonesForStores(
  supabase: SupabaseClient,
  storeIds: string[]
): Promise<DeliveryZoneRow[]> {
  if (storeIds.length === 0) return [];
  const { data } = await supabase.from("delivery_zones").select("*").in("store_id", storeIds);
  return (data as DeliveryZoneRow[]) ?? [];
}

export async function createZone(
  supabase: SupabaseClient,
  storeId: string,
  city: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("delivery_zones").insert({
    store_id: storeId,
    city,
    fee_domicile: 2000,
    fee_relais: 1000,
    has_relais: false,
    has_boutique: false,
  });
  return { error: error?.message ?? null };
}

export async function updateZone(
  supabase: SupabaseClient,
  zoneId: string,
  patch: Partial<Pick<DeliveryZoneRow, "fee_domicile" | "fee_relais" | "has_relais" | "has_boutique">>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("delivery_zones").update(patch).eq("id", zoneId);
  return { error: error?.message ?? null };
}

export async function deleteZone(supabase: SupabaseClient, zoneId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("delivery_zones").delete().eq("id", zoneId);
  return { error: error?.message ?? null };
}
