"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Order } from "@/lib/types";

const STATUS_LABELS: Record<Order["status"], string> = {
  nouvelle: "Nouvelle",
  paiement_attente: "Paiement en attente",
  payee: "Payée",
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export function SuiviPageClient({ initialCode }: { initialCode: string }) {
  const findOrder = useShopStore((s) => s.findOrder);
  const [query, setQuery] = useState(initialCode);
  const [order, setOrder] = useState<Order | undefined>(() =>
    initialCode ? findOrder(initialCode) : undefined
  );
  const [searched, setSearched] = useState(Boolean(initialCode));

  function runSearch(q: string) {
    if (!q.trim()) return;
    setOrder(findOrder(q));
    setSearched(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Suivi de commande</h1>
      <p className="mb-5 text-sm text-gray-500">
        Entrez votre numéro de commande (ex: AV-XXXXXX) ou votre numéro de téléphone.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="mb-6 flex gap-2"
      >
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code commande ou téléphone"
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-orange"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-orange px-5 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Rechercher
        </button>
      </form>

      {searched && !order && (
        <EmptyState
          title="Commande introuvable"
          description="Vérifiez le code ou le numéro de téléphone saisi."
        />
      )}

      {order && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy">{order.code}</p>
              <p className="text-xs text-gray-400">
                {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          <OrderTimeline status={order.status} />

          <div className="mt-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Total</span>
              <span className="font-semibold text-navy">{formatFCFA(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
