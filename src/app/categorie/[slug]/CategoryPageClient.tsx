"use client";

import { useMemo, useState } from "react";
import { useShopStore } from "@/lib/store/shop";
import { CATEGORIES } from "@/lib/data";
import { filterAndSortProducts } from "@/lib/filter";
import { FilterBar, type Filters } from "@/components/product/FilterSort";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function CategoryPageClient({ slug }: { slug: string }) {
  const products = useShopStore((s) => s.products);
  const category = CATEGORIES.find((c) => c.slug === slug)!;

  const [filters, setFilters] = useState<Filters>({
    category: slug,
    sort: "pertinence",
    onlyPromo: false,
    onlyStock: false,
  });

  const results = useMemo(
    () => filterAndSortProducts(products, { filters }),
    [products, filters]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">{category.name}</h1>
      <p className="mb-4 text-sm text-gray-500">
        Découvrez notre sélection {category.name.toLowerCase()}.
      </p>

      <FilterBar filters={filters} onChange={setFilters} resultCount={results.length} />

      {results.length === 0 ? (
        <EmptyState
          title="Aucun produit dans cette catégorie"
          description="Revenez bientôt, de nouveaux produits arrivent régulièrement."
          actionLabel="Voir tout le catalogue"
          actionHref="/catalogue"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
