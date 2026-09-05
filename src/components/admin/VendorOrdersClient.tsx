"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { listVendorOrderItems, updateOrderItemStatus, type VendorOrderItemRow } from "@/lib/db/orderItems";
import { sendDigitalDelivery } from "@/lib/digitalDelivery";
import { formatFCFA } from "@/lib/format";
import type { OrderStatus } from "@/lib/db/types";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "nouvelle", label: "Nouvelle" },
  { value: "confirmee", label: "Confirmée" },
  { value: "preparation", label: "En préparation" },
  { value: "expediee", label: "Expédiée" },
  { value: "livree", label: "Livrée" },
  { value: "annulee", label: "Annulée" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  nouvelle: "bg-navy/10 text-navy",
  confirmee: "bg-blue-100 text-blue-700",
  preparation: "bg-orange-light text-orange-dark",
  expediee: "bg-purple-100 text-purple-700",
  livree: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-600",
};

const PAYMENT_LABELS: Record<string, string> = {
  attente: "Paiement en attente",
  reussi: "Payée",
  echoue: "Paiement échoué",
  annule: "Paiement annulé",
};

const PAYMENT_COLORS: Record<string, string> = {
  attente: "bg-yellow-100 text-yellow-700",
  reussi: "bg-green-100 text-green-700",
  echoue: "bg-red-100 text-red-600",
  annule: "bg-gray-100 text-gray-500",
};

export function VendorOrdersClient({ storeId }: { storeId: string }) {
  const supabase = createClient();
  const [items, setItems] = useState<VendorOrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  useEffect(() => {
    let cancelled = false;
    listVendorOrderItems(supabase, storeId).then((data) => {
      if (cancelled) return;
      setItems(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, refreshKey]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const o = it.orders;
      const matchesQuery =
        !query ||
        o?.code.toLowerCase().includes(query.toLowerCase()) ||
        o?.customer_name.toLowerCase().includes(query.toLowerCase()) ||
        o?.customer_phone.includes(query);
      const matchesStatus = !statusFilter || it.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  async function handleStatusChange(item: VendorOrderItemRow, status: OrderStatus) {
    const { error } = await updateOrderItemStatus(supabase, item.id, status);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Commande ${item.orders?.code} : statut mis à jour`);
    setRefreshKey((k) => k + 1);

    const files = item.products?.product_files ?? [];
    if (status !== "confirmee" && status !== "livree") return;
    if (files.length === 0) return;

    if (item.orders?.payment_status !== "reussi") {
      toast.warning(`Commande ${item.orders?.code} : paiement pas encore confirmé, envoi différé.`);
      return;
    }
    if (!item.orders?.customer_email) {
      toast.warning(`Commande ${item.orders?.code} : produit numérique mais aucun email client renseigné.`);
      return;
    }

    sendDigitalDelivery({
      email: item.orders.customer_email,
      orderCode: item.orders.code,
      customerName: item.orders.customer_name,
      files: files.map((f) => ({ name: f.name, url: f.url })),
    })
      .then(() => toast.success(`Produit numérique envoyé à ${item.orders?.customer_email}`))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Échec de l'envoi du produit numérique"));
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Commandes ({items.length})</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (code, client, téléphone)"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Aucune commande pour le moment.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-2 md:hidden">
            {filtered.map((it) => (
              <div key={it.id} className="rounded-xl bg-white p-3 ring-1 ring-black/5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-navy">{it.orders?.code}</p>
                    <p className="text-xs text-gray-400">
                      {it.orders?.created_at &&
                        new Date(it.orders.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-navy">{formatFCFA(it.subtotal)}</span>
                </div>
                <p className="text-sm text-navy">
                  {it.name} × {it.quantity}
                </p>
                <p className="mb-3 text-xs text-gray-400">
                  {it.orders?.customer_name} — {it.orders?.customer_phone}
                </p>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${PAYMENT_COLORS[it.orders?.payment_status ?? "attente"]}`}>
                    {PAYMENT_LABELS[it.orders?.payment_status ?? "attente"]}
                  </span>
                </div>
                <select
                  value={it.status}
                  onChange={(e) => handleStatusChange(it, e.target.value as OrderStatus)}
                  className={`w-full rounded-lg border-0 px-2 py-2 text-xs font-semibold outline-none ${STATUS_COLORS[it.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                  <th className="px-4 py-3">Commande</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{it.orders?.code}</p>
                      <p className="text-xs text-gray-400">
                        {it.orders?.created_at &&
                          new Date(it.orders.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-navy">{it.orders?.customer_name}</p>
                      <p className="text-xs text-gray-400">{it.orders?.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {it.name} × {it.quantity}
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(it.subtotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_COLORS[it.orders?.payment_status ?? "attente"]}`}>
                        {PAYMENT_LABELS[it.orders?.payment_status ?? "attente"]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={it.status}
                        onChange={(e) => handleStatusChange(it, e.target.value as OrderStatus)}
                        className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold outline-none ${STATUS_COLORS[it.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
