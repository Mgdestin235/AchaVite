import type { SupabaseClient } from "@supabase/supabase-js";
import type { Country, Currency } from "./types";

export async function listCountries(supabase: SupabaseClient): Promise<Country[]> {
  const { data } = await supabase.from("countries").select("*").order("name");
  return (data as Country[]) ?? [];
}

export async function getCountry(supabase: SupabaseClient, code: string): Promise<Country | null> {
  const { data } = await supabase.from("countries").select("*").eq("code", code).maybeSingle();
  return (data as Country) ?? null;
}

export async function updateCountry(
  supabase: SupabaseClient,
  code: string,
  patch: Partial<Pick<Country, "is_active" | "currency_code" | "phone_prefix">>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("countries").update(patch).eq("code", code);
  return { error: error?.message ?? null };
}

export async function listCurrencies(supabase: SupabaseClient): Promise<Currency[]> {
  const { data } = await supabase.from("currencies").select("*").order("code");
  return (data as Currency[]) ?? [];
}
