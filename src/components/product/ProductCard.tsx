"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/format";
import { useCartStore } from "@/lib/store/cart";
import type { Product } from "@/lib/types";
import { ProductBadges } from "./ProductBadges";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const outOfStock = product.stock <= 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product.id, 1);
    toast.success(`${product.name} ajouté au panier`, {
      description: formatFCFA(product.price),
    });
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product.id, 1);
    router.push("/panier");
  }

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/10"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <ProductBadges product={product} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-navy">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star size={13} className="fill-orange text-orange" />
          <span>{product.rating}</span>
          <span className="text-gray-300">•</span>
          <span>{product.sold} vendus</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-orange">
            {formatFCFA(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatFCFA(product.oldPrice)}
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-navy/15 bg-navy/5 px-2 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={14} />
            <span className="hidden sm:inline">Panier</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-orange px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap size={14} className="fill-white" />
            <span>Acheter</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
