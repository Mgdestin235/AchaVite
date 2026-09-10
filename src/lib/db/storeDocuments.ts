import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreDocument } from "./types";

export async function listStoreDocuments(supabase: SupabaseClient, storeId: string): Promise<StoreDocument[]> {
  const { data } = await supabase
    .from("store_documents")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });
  return (data as StoreDocument[]) ?? [];
}

export async function addStoreDocument(
  supabase: SupabaseClient,
  storeId: string,
  label: string,
  fileUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("store_documents").insert({ store_id: storeId, label, file_url: fileUrl });
  return { error: error?.message ?? null };
}

export async function deleteStoreDocument(supabase: SupabaseClient, id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("store_documents").delete().eq("id", id);
  return { error: error?.message ?? null };
}
