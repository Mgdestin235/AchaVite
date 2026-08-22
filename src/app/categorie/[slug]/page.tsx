import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/data";
import { CategoryPageClient } from "./CategoryPageClient";

export async function generateMetadata(props: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  return { title: category ? category.name : "Catégorie" };
}

export default async function CategoryPage(props: PageProps<"/categorie/[slug]">) {
  const { slug } = await props.params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  return <CategoryPageClient slug={slug} />;
}
