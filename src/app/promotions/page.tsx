"use client";

import { useMemo } from "react";
import { useShopStore } from "@/lib/store/shop";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PromotionsPage() {
  const products = useShopStore((s) => s.products);
  const promos = useShopStore((s) => s.promos);

  const promoProducts = useMemo(
    () => products.filter((p) => p.active && p.oldPrice && p.oldPrice > p.price),
    [products]
  );

  const activePromos = promos.filter((p) => p.active);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">🔥 Offres spéciales</h1>
      <p className="mb-5 text-sm text-gray-500">
        Toutes nos meilleures réductions du moment, à ne pas manquer.
      </p>

      {activePromos.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {activePromos.map((p) => (
            <span
              key={p.code}
              className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white"
            >
              Code {p.code} : -{p.type === "percent" ? `${p.value}%` : `${p.value} FCFA`}
            </span>
          ))}
        </div>
      )}

      {promoProducts.length === 0 ? (
        <EmptyState
          title="Aucune promotion active"
          description="Revenez bientôt pour découvrir nos prochaines offres."
          actionLabel="Voir le catalogue"
          actionHref="/catalogue"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {promoProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
