"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { lookupOrderByCodeAndPhone, type OrderWithItems } from "@/lib/orderLookup";
import { resolveOverallStatus } from "@/lib/db/orders";
import { formatFCFA } from "@/lib/format";
import { OrderTimeline } from "@/components/ui/OrderTimeline";
import { EmptyState } from "@/components/ui/EmptyState";

const PAYMENT_LABELS: Record<string, string> = {
  attente: "Paiement en attente de validation",
  reussi: "Paiement confirmé",
  echoue: "Paiement échoué",
  annule: "Paiement annulé",
};

const PAYMENT_COLORS: Record<string, string> = {
  attente: "bg-yellow-100 text-yellow-700",
  reussi: "bg-green-100 text-green-700",
  echoue: "bg-red-100 text-red-600",
  annule: "bg-gray-100 text-gray-500",
};

export function SuiviPageClient({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) {
      setError("Merci de renseigner le code de commande et le numéro de téléphone utilisé.");
      return;
    }
    setSearching(true);
    setError("");
    const { order: found, error: err } = await lookupOrderByCodeAndPhone(code, phone);
    setSearching(false);
    setSearched(true);
    setOrder(found);
    if (err) setError(err);
  }

  const overallStatus = order ? resolveOverallStatus(order.order_items.map((it) => it.status)) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Suivi de commande</h1>
      <p className="mb-5 text-sm text-gray-500">
        Entrez le code de votre commande (ex : AV-XXXXXX) et le numéro de téléphone utilisé lors
        de la commande.
      </p>

      <form onSubmit={runSearch} className="mb-6 space-y-2">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code commande (ex : AV-XXXXXX)"
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-orange"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Numéro de téléphone"
            className="flex-1 rounded-xl border border-gray-200 py-3 px-3 text-sm outline-none focus:border-orange"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-orange px-5 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
          >
            {searching ? "Recherche..." : "Rechercher"}
          </button>
        </div>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </form>

      {searched && !order && !error && (
        <EmptyState
          title="Commande introuvable"
          description="Vérifiez le code et le numéro de téléphone saisis."
        />
      )}

      {order && overallStatus && (
        <div className="rounded-xl bg-white p-5 ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy">{order.code}</p>
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_COLORS[order.payment_status]}`}>
              {PAYMENT_LABELS[order.payment_status]}
            </span>
          </div>

          <OrderTimeline status={overallStatus} />

          <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
            {order.order_items.map((it) => (
              <div key={it.id} className="flex justify-between text-gray-500">
                <span className="truncate">
                  {it.name} × {it.quantity}
                  {it.stores && <span className="text-gray-400"> — {it.stores.name}</span>}
                </span>
                <span className="shrink-0 font-medium text-navy">{formatFCFA(it.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-navy">
              <span>Total</span>
              <span>{formatFCFA(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
