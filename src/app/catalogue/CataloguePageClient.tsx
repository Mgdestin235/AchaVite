"use client";

import { useMemo, useState } from "react";
import { useShopStore } from "@/lib/store/shop";
import { filterAndSortProducts } from "@/lib/filter";
import { FilterBar, type Filters, type SortKey } from "@/components/product/FilterSort";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function CataloguePageClient({
  query,
  initialSort,
  initialCategory,
}: {
  query: string;
  initialSort: SortKey;
  initialCategory: string;
}) {
  const products = useShopStore((s) => s.products);

  const [filters, setFilters] = useState<Filters>({
    category: initialCategory,
    sort: initialSort,
    onlyPromo: false,
    onlyStock: false,
  });

  const results = useMemo(
    () => filterAndSortProducts(products, { query, filters }),
    [products, query, filters]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">
        {query ? `Résultats pour « ${query} »` : "Catalogue"}
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        Parcourez tous nos produits et trouvez votre prochaine bonne affaire.
      </p>

      <FilterBar filters={filters} onChange={setFilters} resultCount={results.length} />

      {results.length === 0 ? (
        <EmptyState
          title="Aucun produit trouvé"
          description="Essayez un autre mot-clé ou modifiez vos filtres."
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
