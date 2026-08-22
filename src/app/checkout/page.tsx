"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Store, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";
import { useShopStore } from "@/lib/store/shop";
import { useAuthStore } from "@/lib/store/auth";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DeliveryMode } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const promoCode = useCartStore((s) => s.promoCode);
  const clearCart = useCartStore((s) => s.clear);
  const products = useShopStore((s) => s.products);
  const promos = useShopStore((s) => s.promos);
  const zones = useShopStore((s) => s.zones);
  const createOrder = useShopStore((s) => s.createOrder);
  const currentCustomer = useAuthStore((s) => s.currentCustomer());

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((x): x is { line: typeof x.line; product: NonNullable<typeof x.product> } => !!x.product),
    [lines, products]
  );

  const [name, setName] = useState(currentCustomer?.name ?? "");
  const [phone, setPhone] = useState(currentCustomer?.phone ?? "");
  const [city, setCity] = useState(zones[0]?.city ?? "");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [mode, setMode] = useState<DeliveryMode>("domicile");
  const [relaisPoint, setRelaisPoint] = useState("");

  const subtotal = items.reduce((s, i) => s + i.product.price * i.line.qty, 0);
  const activePromo = promos.find(
    (p) => p.code.toLowerCase() === promoCode?.toLowerCase() && p.active
  );
  const discount = activePromo
    ? activePromo.type === "percent"
      ? Math.round((subtotal * activePromo.value) / 100)
      : Math.min(activePromo.value, subtotal)
    : 0;

  const zone = zones.find((z) => z.city === city);
  const deliveryFee =
    !zone ? 0 : mode === "domicile" ? zone.feeDomicile : mode === "relais" ? zone.feeRelais : 0;
  const total = subtotal - discount + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Votre panier est vide"
          description="Ajoutez des produits à votre panier avant de passer au paiement."
          actionLabel="Découvrir les produits"
          actionHref="/catalogue"
        />
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city) {
      toast.error("Merci de renseigner votre nom, téléphone et ville.");
      return;
    }
    if (mode === "domicile" && !address.trim()) {
      toast.error("Merci de renseigner votre adresse de livraison.");
      return;
    }
    if (mode === "relais" && !relaisPoint) {
      toast.error("Merci de choisir un point relais.");
      return;
    }

    const order = createOrder({
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        city,
        address: mode === "domicile" ? address.trim() : "",
        neighborhood: neighborhood.trim() || undefined,
        account: currentCustomer?.phone,
      },
      items: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        image: i.product.images[0],
        price: i.product.price,
        qty: i.line.qty,
      })),
      subtotal,
      discount,
      promoCode: activePromo?.code,
      deliveryFee,
      total,
      deliveryMode: mode,
      relaisPoint: mode === "relais" ? relaisPoint : undefined,
      paymentMethod: "mtn",
    });

    clearCart();
    router.push(`/paiement?commande=${order.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-bold text-navy sm:text-2xl">Informations de livraison</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <h2 className="mb-3 text-sm font-bold uppercase text-gray-400">Vos informations</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom complet"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numéro de téléphone"
                type="tel"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
              />
              {!currentCustomer && (
                <p className="text-xs text-gray-400 sm:col-span-2">
                  Pas besoin de créer un compte : votre numéro suffit pour suivre votre commande.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <h2 className="mb-3 text-sm font-bold uppercase text-gray-400">Mode de livraison</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "domicile" as const, label: "À domicile", icon: Home },
                { value: "relais" as const, label: "Point relais", icon: MapPinned, disabled: !zone?.hasRelais },
                { value: "boutique" as const, label: "Retrait boutique", icon: Store, disabled: !zone?.hasBoutique },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  disabled={opt.disabled}
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30",
                    mode === opt.value ? "border-orange bg-orange-light text-orange-dark" : "border-gray-200 text-navy"
                  )}
                >
                  <opt.icon size={20} />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
              >
                {zones.map((z) => (
                  <option key={z.city} value={z.city}>{z.city}</option>
                ))}
              </select>

              {mode === "domicile" && (
                <>
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Quartier"
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
                  />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresse précise"
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
                  />
                </>
              )}

              {mode === "relais" && zone && (
                <select
                  value={relaisPoint}
                  onChange={(e) => setRelaisPoint(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
                >
                  <option value="">Choisir un point relais</option>
                  {zone.relaisPoints.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <h2 className="mb-3 text-sm font-bold uppercase text-gray-400">Résumé de commande</h2>
          <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto text-sm">
            {items.map(({ line, product }) => (
              <li key={product.id} className="flex justify-between gap-2 text-gray-600">
                <span className="line-clamp-1">{product.name} × {line.qty}</span>
                <span className="shrink-0 font-medium text-navy">
                  {formatFCFA(product.price * line.qty)}
                </span>
              </li>
            ))}
          </ul>
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
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span>{deliveryFee > 0 ? formatFCFA(deliveryFee) : "Gratuite"}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-navy">
            <span>Total à payer</span>
            <span>{formatFCFA(total)}</span>
          </div>
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-orange/25 hover:bg-orange-dark active:scale-95"
          >
            Continuer vers le paiement
          </button>
        </div>
      </form>
    </div>
  );
}
