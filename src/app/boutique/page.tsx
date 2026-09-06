import { createClient } from "@/lib/supabase/server";
import { listPublicProducts, toLegacyProduct } from "@/lib/db/products";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";

export default async function BoutiquePage() {
  const supabase = await createClient();
  const rows = await listPublicProducts(supabase);
  const active = rows.map(toLegacyProduct);

  const promoProducts = active.filter((p) => p.oldPrice && p.oldPrice > p.price).slice(0, 10);
  const popular = [...active].sort((a, b) => b.sold - a.sold).slice(0, 10);
  const newest = [...active]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 10);

  return (
    <div>
      <Hero />
      <CategoryGrid />
      <ProductSection
        title="Offres du moment"
        emoji="🔥"
        products={promoProducts}
        viewAllHref="/promotions"
      />
      <ProductSection
        title="Produits populaires"
        products={popular}
        viewAllHref="/catalogue?tri=populaire"
      />
      <ProductSection
        title="Nouveautés"
        products={newest}
        viewAllHref="/catalogue?tri=nouveaute"
      />
    </div>
  );
}
