"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Store, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { listPublicProductsByIds, type ProductWithRelations } from "@/lib/db/products";
import { listZonesForStores } from "@/lib/db/deliveryZones";
import { findActivePromoByCode } from "@/lib/db/promos";
import { createOrder } from "@/lib/db/orders";
import { saveLastOrder } from "@/lib/lastOrder";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DeliveryMode } from "@/lib/db/types";
import type { PromoRow } from "@/lib/db/types";
import { cn } from "@/lib/cn";

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const lines = useCartStore((s) => s.lines);
  const promoCode = useCartStore((s) => s.promoCode);
  const clearCart = useCartStore((s) => s.clear);
  const clearPromo = useCartStore((s) => s.clearPromo);

  const ids = useMemo(() => lines.map((l) => l.productId), [lines]);
  const [customer, setCustomer] = useState<{ id: string; name: string; phone: string; email: string } | null | undefined>(
    undefined
  );
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [zones, setZones] = useState<
    { id: string; store_id: string; city: string; fee_domicile: number; fee_relais: number; has_relais: boolean; has_boutique: boolean; relais_points: string[] }[]
  >([]);
  const [activePromo, setActivePromo] = useState<PromoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((x): x is { line: typeof x.line; product: NonNullable<typeof x.product> } => !!x.product),
    [lines, products]
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [mode, setMode] = useState<DeliveryMode>("domicile");
  const [relaisPoint, setRelaisPoint] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return;
      if (!user) {
        setCustomer(null);
        router.push("/connexion?redirect=/checkout");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const info = { id: user.id, name: profile?.name ?? "", phone: profile?.phone ?? "", email: user.email ?? "" };
      setCustomer(info);
      setName(info.name);
      setPhone(info.phone);
      setEmail(info.email);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    listPublicProductsByIds(supabase, ids).then(async (rows) => {
      if (cancelled) return;
      setProducts(rows);
      const storeIds = [...new Set(rows.map((p) => p.store_id))];
      const zoneRows = await listZonesForStores(supabase, storeIds);
      if (cancelled) return;
      setZones(zoneRows);
      if (zoneRows.length > 0) setCity((c) => c || zoneRows[0].city);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  useEffect(() => {
    let cancelled = false;
    const promise = promoCode ? findActivePromoByCode(supabase, promoCode) : Promise.resolve(null);
    promise.then((promo) => {
      if (!cancelled) setActivePromo(promo);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoCode]);

  const hasDigitalItem = items.some((i) => i.product.product_files.length > 0);
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.line.qty, 0);

  const promoStoreSubtotal = activePromo
    ? items
        .filter((i) => i.product.store_id === activePromo.store_id)
        .reduce((s, i) => s + Number(i.product.price) * i.line.qty, 0)
    : 0;
  const discount = activePromo
    ? Math.min(
        activePromo.type === "percent"
          ? Math.round((promoStoreSubtotal * activePromo.value) / 100)
          : activePromo.value,
        promoStoreSubtotal
      )
    : 0;

  const cities = [...new Set(zones.map((z) => z.city))];
  const zonesForCity = zones.filter((z) => z.city === city);
  const relaisAvailable = zonesForCity.length > 0 && zonesForCity.every((z) => z.has_relais);
  const boutiqueAvailable = zonesForCity.length > 0 && zonesForCity.every((z) => z.has_boutique);
  const relaisPoints = [...new Set(zonesForCity.flatMap((z) => z.relais_points))];

  const storeIdsInCart = [...new Set(items.map((i) => i.product.store_id))];
  const deliveryFee = storeIdsInCart.reduce((sum, storeId) => {
    const zone = zonesForCity.find((z) => z.store_id === storeId);
    if (!zone) return sum;
    return sum + (mode === "domicile" ? Number(zone.fee_domicile) : mode === "relais" ? Number(zone.fee_relais) : 0);
  }, 0);

  const total = subtotal - discount + deliveryFee;

  if (loading || customer === undefined) {
    return <p className="py-20 text-center text-sm text-gray-400">Chargement...</p>;
  }

  if (!customer) {
    // useEffect already triggered the redirect to /connexion; avoid a flash
    // of the checkout form while that navigation happens.
    return null;
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
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
    if (hasDigitalItem && !email.trim()) {
      toast.error("Votre commande contient un produit numérique : merci de renseigner votre email pour le recevoir.");
      return;
    }

    setSubmitting(true);
    const { order, error } = await createOrder(supabase, {
      customer: {
        id: customer.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city,
        address: mode === "domicile" ? address.trim() : "",
        neighborhood: neighborhood.trim() || undefined,
      },
      items: items.map((i) => ({
        productId: i.product.id,
        storeId: i.product.store_id,
        name: i.product.name,
        image: i.product.product_images[0]?.url ?? null,
        price: Number(i.product.price),
        quantity: i.line.qty,
      })),
      subtotal,
      discount,
      promoCode: activePromo?.code,
      deliveryFee,
      total,
      deliveryMode: mode,
      relaisPoint: mode === "relais" ? relaisPoint : undefined,
    });
    setSubmitting(false);

    if (error || !order) {
      toast.error(error || "Une erreur est survenue lors de la création de la commande.");
      return;
    }

    saveLastOrder({
      id: order.id,
      code: order.code,
      subtotal,
      discount,
      deliveryFee,
      total,
      deliveryMode: mode,
      relaisPoint: mode === "relais" ? relaisPoint : undefined,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || undefined,
      customerCity: city,
      customerAddress: mode === "domicile" ? address.trim() : undefined,
      estimatedDelivery: order.estimated_delivery ?? new Date().toISOString(),
      items: items.map((i) => ({
        name: i.product.name,
        image: i.product.product_images[0]?.url ?? null,
        price: Number(i.product.price),
        quantity: i.line.qty,
        hasFiles: i.product.product_files.length > 0,
      })),
      paymentStatus: "attente",
      digitalDelivered: false,
    });

    clearCart();
    clearPromo();
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
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={hasDigitalItem ? "Email (obligatoire pour le produit numérique)" : "Email (optionnel)"}
                type="email"
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
              />
              {hasDigitalItem && (
                <p className="text-xs text-orange-dark sm:col-span-2">
                  Votre commande contient un produit numérique : il vous sera envoyé par email
                  après validation du paiement.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <h2 className="mb-3 text-sm font-bold uppercase text-gray-400">Mode de livraison</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "domicile" as const, label: "À domicile", icon: Home },
                { value: "relais" as const, label: "Point relais", icon: MapPinned, disabled: !relaisAvailable },
                { value: "boutique" as const, label: "Retrait boutique", icon: Store, disabled: !boutiqueAvailable },
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
              {cities.length > 0 ? (
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Votre ville"
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
                />
              )}

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

              {mode === "relais" && relaisPoints.length > 0 && (
                <select
                  value={relaisPoint}
                  onChange={(e) => setRelaisPoint(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
                >
                  <option value="">Choisir un point relais</option>
                  {relaisPoints.map((r) => (
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
                  {formatFCFA(Number(product.price) * line.qty)}
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
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-orange/25 hover:bg-orange-dark active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Création de la commande..." : "Continuer vers le paiement"}
          </button>
        </div>
      </form>
    </div>
  );
}
