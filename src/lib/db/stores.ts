import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/format";
import type { Store, StoreStatus } from "./types";

export async function getStoreByOwner(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Store | null> {
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  return (data as Store) ?? null;
}

export async function getStoreBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Store | null> {
  const { data } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
  return (data as Store) ?? null;
}

export async function listStores(
  supabase: SupabaseClient,
  filter?: { status?: StoreStatus }
): Promise<Store[]> {
  let query = supabase.from("stores").select("*").order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data } = await query;
  return (data as Store[]) ?? [];
}

async function uniqueStoreSlug(supabase: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let attempt = 1;
  while (true) {
    const { data } = await supabase.from("stores").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export async function createStore(
  supabase: SupabaseClient,
  ownerId: string,
  input: {
    name: string;
    description?: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    city?: string;
    categoryId?: string;
    openingHours?: string;
    deliveryInfo?: string;
  }
): Promise<{ store: Store | null; error: string | null }> {
  const slug = await uniqueStoreSlug(supabase, input.name);
  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_id: ownerId,
      name: input.name,
      slug,
      description: input.description,
      phone: input.phone,
      whatsapp_number: input.whatsappNumber,
      address: input.address,
      city: input.city,
      category_id: input.categoryId,
      opening_hours: input.openingHours,
      delivery_info: input.deliveryInfo,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return { store: null, error: error.message };
  return { store: data as Store, error: null };
}

export async function updateStore(
  supabase: SupabaseClient,
  storeId: string,
  patch: Partial<Store>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("stores").update(patch).eq("id", storeId);
  return { error: error?.message ?? null };
}
