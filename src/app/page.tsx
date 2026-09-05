"use client";

import { useMemo } from "react";
import { useShopStore } from "@/lib/store/shop";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";

export default function HomePage() {
  const products = useShopStore((s) => s.products);

  const active = useMemo(() => products.filter((p) => p.active), [products]);
  const promoProducts = useMemo(
    () => active.filter((p) => p.oldPrice && p.oldPrice > p.price).slice(0, 10),
    [active]
  );
  const popular = useMemo(
    () => [...active].sort((a, b) => b.sold - a.sold).slice(0, 10),
    [active]
  );
  const newest = useMemo(
    () =>
      [...active]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 10),
    [active]
  );

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
