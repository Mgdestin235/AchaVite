"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS_LABELS: Record<Order["status"], string> = {
  nouvelle: "Nouvelle",
  paiement_attente: "Paiement en attente",
  payee: "Payée",
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  nouvelle: "bg-navy/10 text-navy",
  paiement_attente: "bg-yellow-100 text-yellow-700",
  payee: "bg-blue-100 text-blue-700",
  preparation: "bg-orange-light text-orange-dark",
  expediee: "bg-purple-100 text-purple-700",
  livree: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-600",
};

type Tab = "toutes" | "en-cours" | "livrees";

export default function MyOrdersPage() {
  const currentCustomer = useAuthStore((s) => s.currentCustomer());
  const orders = useShopStore((s) => s.orders);
  const [phoneQuery, setPhoneQuery] = useState("");
  const [lookupPhone, setLookupPhone] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("toutes");

  const phone = currentCustomer?.phone ?? lookupPhone;

  const myOrders = useMemo(() => {
    if (!phone) return [];
    return orders.filter((o) => o.customer.phone.replace(/\s/g, "").includes(phone.replace(/\s/g, "")));
  }, [orders, phone]);

  const filtered = myOrders.filter((o) => {
    if (tab === "en-cours") return !["livree", "annulee"].includes(o.status);
    if (tab === "livrees") return o.status === "livree";
    return true;
  });

  if (!phone) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="mb-1 text-xl font-bold text-navy">Mes commandes</h1>
        <p className="mb-5 text-sm text-gray-500">
          Connectez-vous, ou entrez votre numéro de téléphone pour retrouver vos commandes.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLookupPhone(phoneQuery);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="Votre numéro de téléphone"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange"
            />
          </div>
          <button className="rounded-lg bg-orange px-4 text-sm font-bold text-white hover:bg-orange-dark">
            Voir
          </button>
        </form>
        <Link href="/connexion" className="mt-4 block text-center text-sm font-semibold text-navy hover:text-orange">
          Ou se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-xl font-bold text-navy">Mes commandes</h1>

      <div className="mb-5 flex gap-2">
        {[
          { key: "toutes" as const, label: "Toutes" },
          { key: "en-cours" as const, label: "En cours" },
          { key: "livrees" as const, label: "Livrées" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-navy text-white" : "bg-navy/5 text-navy"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune commande ici"
          description="Vos commandes apparaîtront ici une fois passées."
          actionLabel="Découvrir les produits"
          actionHref="/catalogue"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/suivi?code=${order.code}`}
              className="block rounded-xl bg-white p-4 ring-1 ring-black/5 hover:ring-orange/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-navy">{order.code}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[order.status])}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="mb-2 flex -space-x-2">
                {order.items.slice(0, 4).map((it, i) => (
                  <div key={i} className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-100">
                    <Image src={it.image} alt={it.name} fill className="object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
                <span className="font-semibold text-navy">{formatFCFA(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
