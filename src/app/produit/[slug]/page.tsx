import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicProductBySlug } from "@/lib/db/products";
import { ProductPageClient } from "./ProductPageClient";

export async function generateMetadata(props: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();
  const product = await getPublicProductBySlug(supabase, slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.product_images[0] ? [product.product_images[0].url] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/produit/[slug]">) {
  const { slug } = await props.params;
  return <ProductPageClient slug={slug} />;
}
