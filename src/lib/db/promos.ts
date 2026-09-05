import type { SupabaseClient } from "@supabase/supabase-js";
import type { PromoRow } from "./types";

/** Public listing of every currently-active promo code, across all vendors (for the /promotions page). */
export async function listActivePromos(supabase: SupabaseClient): Promise<PromoRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("promos")
    .select("*")
    .eq("active", true)
    .lte("start_date", today)
    .gte("end_date", today);
  return (data as PromoRow[]) ?? [];
}

export async function findActivePromoByCode(supabase: SupabaseClient, code: string): Promise<PromoRow | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("promos")
    .select("*")
    .ilike("code", code)
    .eq("active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .maybeSingle();
  return (data as PromoRow) ?? null;
}

export async function listVendorPromos(supabase: SupabaseClient, storeId: string): Promise<PromoRow[]> {
  const { data } = await supabase
    .from("promos")
    .select("*")
    .eq("store_id", storeId)
    .order("start_date", { ascending: false });
  return (data as PromoRow[]) ?? [];
}

export type PromoInput = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  startDate: string;
  endDate: string;
  maxUses: number;
};

export async function createPromo(
  supabase: SupabaseClient,
  storeId: string,
  input: PromoInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("promos").insert({
    store_id: storeId,
    code: input.code,
    type: input.type,
    value: input.value,
    start_date: input.startDate,
    end_date: input.endDate,
    max_uses: input.maxUses,
    active: true,
  });
  return { error: error?.message ?? null };
}

export async function updatePromoActive(
  supabase: SupabaseClient,
  promoId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("promos").update({ active }).eq("id", promoId);
  return { error: error?.message ?? null };
}

export async function deletePromo(supabase: SupabaseClient, promoId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("promos").delete().eq("id", promoId);
  return { error: error?.message ?? null };
}
