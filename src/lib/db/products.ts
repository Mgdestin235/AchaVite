import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/format";
import type { Product } from "@/lib/types";
import type { ProductFileRow, ProductRow } from "./types";

export type ProductWithRelations = ProductRow & {
  product_images: { id: string; url: string; position: number }[];
  product_files: ProductFileRow[];
  stores: { id: string; name: string; slug: string; whatsapp_number: string | null; city: string | null } | null;
  categories: { slug: string; name: string } | null;
};

const PRODUCT_SELECT =
  "*, product_images(id, url, position), product_files(id, name, url, kind), " +
  "stores(id, name, slug, whatsapp_number, city), categories(slug, name)";

/**
 * Storefront display components (ProductCard, ProductBadges, FilterSort's
 * client-side filterAndSortProducts, ...) still speak the pre-marketplace
 * `Product` shape from `@/lib/types` — mapping into it here means none of
 * that UI needs to change while the data itself now comes from Postgres.
 */
export function toLegacyProduct(p: ProductWithRelations): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.categories?.slug ?? "",
    price: Number(p.price),
    oldPrice: p.old_price ? Number(p.old_price) : undefined,
    images: p.product_images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((img) => img.url),
    videoUrl: p.video_url ?? undefined,
    files: p.product_files.map((f) => ({ id: f.id, name: f.name, url: f.url, kind: f.kind })),
    description: p.description ?? "",
    highlights: p.highlights,
    stock: p.stock,
    rating: Number(p.rating),
    reviews: p.reviews_count,
    sold: p.sold_count,
    isNew: p.is_new,
    isBestSeller: p.is_best_seller,
    active: p.status === "active",
    createdAt: p.created_at,
  };
}

export async function listPublicProducts(
  supabase: SupabaseClient,
  filters?: { categoryId?: string; storeId?: string; search?: string }
): Promise<ProductWithRelations[]> {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .eq("stores.status", "approved")
    .order("created_at", { ascending: false });

  if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters?.storeId) query = query.eq("store_id", filters.storeId);
  if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

  const { data } = await query;
  // Supabase can't filter on a joined table directly in all query shapes;
  // belt-and-suspenders filter here too (RLS already enforces this anyway).
  return ((data as unknown as ProductWithRelations[]) ?? []).filter((p) => p.stores);
}

/** Used by the cart page to resolve full product data for a list of localStorage-held ids. */
export async function listPublicProductsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<ProductWithRelations[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids);
  return (data as unknown as ProductWithRelations[]) ?? [];
}

export async function getPublicProductBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ProductWithRelations | null> {
  const { data } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  return (data as unknown as ProductWithRelations) ?? null;
}

export async function listVendorProducts(
  supabase: SupabaseClient,
  storeId: string
): Promise<ProductWithRelations[]> {
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  return (data as unknown as ProductWithRelations[]) ?? [];
}

async function uniqueProductSlug(supabase: SupabaseClient, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let attempt = 1;
  while (true) {
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

export type ProductInput = {
  name: string;
  categoryId: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  description: string;
  highlights: string[];
  isNew: boolean;
  isBestSeller: boolean;
  status: "active" | "inactive";
  videoUrl?: string;
  images: string[];
  files: { name: string; url: string; kind: "pdf" | "ebook" }[];
};

export async function createProduct(
  supabase: SupabaseClient,
  storeId: string,
  input: ProductInput
): Promise<{ id: string | null; error: string | null }> {
  const slug = await uniqueProductSlug(supabase, input.name);
  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      category_id: input.categoryId,
      name: input.name,
      slug,
      description: input.description,
      highlights: input.highlights,
      price: input.price,
      old_price: input.oldPrice,
      stock: input.stock,
      video_url: input.videoUrl || null,
      status: input.status,
      is_new: input.isNew,
      is_best_seller: input.isBestSeller,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  const productId = data.id as string;

  await Promise.all([
    input.images.length > 0
      ? supabase.from("product_images").insert(
          input.images.map((url, position) => ({ product_id: productId, url, position }))
        )
      : Promise.resolve(),
    input.files.length > 0
      ? supabase.from("product_files").insert(
          input.files.map((f) => ({ product_id: productId, name: f.name, url: f.url, kind: f.kind }))
        )
      : Promise.resolve(),
  ]);

  return { id: productId, error: null };
}

export async function updateProduct(
  supabase: SupabaseClient,
  productId: string,
  input: ProductInput
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      highlights: input.highlights,
      price: input.price,
      old_price: input.oldPrice,
      stock: input.stock,
      video_url: input.videoUrl || null,
      status: input.status,
      is_new: input.isNew,
      is_best_seller: input.isBestSeller,
    })
    .eq("id", productId);
  if (error) return { error: error.message };

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_files").delete().eq("product_id", productId);
  await Promise.all([
    input.images.length > 0
      ? supabase.from("product_images").insert(
          input.images.map((url, position) => ({ product_id: productId, url, position }))
        )
      : Promise.resolve(),
    input.files.length > 0
      ? supabase.from("product_files").insert(
          input.files.map((f) => ({ product_id: productId, name: f.name, url: f.url, kind: f.kind }))
        )
      : Promise.resolve(),
  ]);

  return { error: null };
}

export async function deleteProduct(supabase: SupabaseClient, productId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  return { error: error?.message ?? null };
}

export async function updateProductStock(
  supabase: SupabaseClient,
  productId: string,
  stock: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ stock: Math.max(0, stock) })
    .eq("id", productId);
  return { error: error?.message ?? null };
}
