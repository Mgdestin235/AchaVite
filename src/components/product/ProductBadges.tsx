import { discountPercent } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductBadges({ product }: { product: Product }) {
  const discount = discountPercent(product.price, product.oldPrice);
  return (
    <div className="absolute left-2 top-2 flex flex-col gap-1.5">
      {discount > 0 && (
        <span className="rounded-md bg-orange px-2 py-0.5 text-xs font-bold text-white shadow-sm">
          -{discount}%
        </span>
      )}
      {product.isNew && (
        <span className="rounded-md bg-navy px-2 py-0.5 text-xs font-bold text-white shadow-sm">
          NOUVEAU
        </span>
      )}
      {product.isBestSeller && (
        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-navy shadow-sm ring-1 ring-navy/10">
          Meilleure vente
        </span>
      )}
      {product.stock <= 0 && (
        <span className="rounded-md bg-gray-700 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
          Épuisé
        </span>
      )}
    </div>
  );
}
