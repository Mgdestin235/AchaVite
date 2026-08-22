import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/data";
import { ProductPageClient } from "./ProductPageClient";

export async function generateMetadata(props: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage(props: PageProps<"/produit/[slug]">) {
  const { slug } = await props.params;
  return <ProductPageClient slug={slug} />;
}
