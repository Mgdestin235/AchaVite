"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Tag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CartPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const promoCode = useCartStore((s) => s.promoCode);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const clearPromo = useCartStore((s) => s.clearPromo);
  const products = useShopStore((s) => s.products);
  const promos = useShopStore((s) => s.promos);

  const [promoInput, setPromoInput] = useState("");

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((x): x is { line: typeof x.line; product: NonNullable<typeof x.product> } => !!x.product),
    [lines, products]
  );

  const subtotal = items.reduce((s, i) => s + i.product.price * i.line.qty, 0);

  const activePromo = promos.find(
    (p) => p.code.toLowerCase() === promoCode?.toLowerCase() && p.active
  );
  const discount = activePromo
    ? activePromo.type === "percent"
      ? Math.round((subtotal * activePromo.value) / 100)
      : Math.min(activePromo.value, subtotal)
    : 0;

  function handleApplyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    const found = promos.find((p) => p.code.toLowerCase() === code.toLowerCase() && p.active);
    if (!found) {
      toast.error("Code promo invalide ou expiré");
      return;
    }
    applyPromo(found.code);
    toast.success(`Code ${found.code} appliqué`);
    setPromoInput("");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Votre panier est vide"
          description="Découvrez nos meilleures offres et trouvez votre prochaine bonne affaire."
          actionLabel="Découvrir les produits"
          actionHref="/catalogue"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-bold text-navy sm:text-2xl">
        Votre panier ({items.length})
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map(({ line, product }) => (
            <div
              key={product.id}
              className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5 sm:gap-4 sm:p-4"
            >
              <Link href={`/produit/${product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-2">
                  <Link
                    href={`/produit/${product.slug}`}
                    className="line-clamp-2 text-sm font-medium text-navy hover:text-orange sm:text-base"
                  >
                    {product.name}
                  </Link>
                  <button
                    onClick={() => removeItem(product.id)}
                    className="shrink-0 text-gray-400 hover:text-red-500"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                      onClick={() => setQty(product.id, line.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center text-navy hover:bg-gray-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{line.qty}</span>
                    <button
                      onClick={() => setQty(product.id, Math.min(product.stock, line.qty + 1))}
                      className="flex h-8 w-8 items-center justify-center text-navy hover:bg-gray-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-orange sm:text-base">
                    {formatFCFA(product.price * line.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <h2 className="mb-3 text-sm font-bold uppercase text-gray-400">Résumé</h2>

          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Tag size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Code promo"
                className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-sm outline-none focus:border-orange"
              />
            </div>
            <button
              onClick={handleApplyPromo}
              className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy-light"
            >
              Appliquer
            </button>
          </div>
          {activePromo && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-orange-light px-3 py-2 text-xs">
              <span className="font-semibold text-orange-dark">
                Code {activePromo.code} appliqué
              </span>
              <button onClick={clearPromo} className="text-orange-dark underline">
                Retirer
              </button>
            </div>
          )}

          <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{formatFCFA(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Réduction</span>
                <span>-{formatFCFA(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Livraison</span>
              <span>Calculée au checkout</span>
            </div>
          </div>

          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-navy">
            <span>Total</span>
            <span>{formatFCFA(subtotal - discount)}</span>
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-orange/25 hover:bg-orange-dark active:scale-95"
          >
            Passer au paiement
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
