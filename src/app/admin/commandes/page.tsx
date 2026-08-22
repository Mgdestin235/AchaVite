"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "nouvelle", label: "Nouvelle" },
  { value: "paiement_attente", label: "Paiement en attente" },
  { value: "payee", label: "Payée" },
  { value: "preparation", label: "En préparation" },
  { value: "expediee", label: "Expédiée" },
  { value: "livree", label: "Livrée" },
  { value: "annulee", label: "Annulée" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  nouvelle: "bg-navy/10 text-navy",
  paiement_attente: "bg-yellow-100 text-yellow-700",
  payee: "bg-blue-100 text-blue-700",
  preparation: "bg-orange-light text-orange-dark",
  expediee: "bg-purple-100 text-purple-700",
  livree: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-600",
};

const DELIVERY_LABELS: Record<Order["deliveryMode"], string> = {
  domicile: "Domicile",
  relais: "Point relais",
  boutique: "Boutique",
};

export default function AdminOrdersPage() {
  const orders = useShopStore((s) => s.orders);
  const setOrderStatus = useShopStore((s) => s.setOrderStatus);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesQuery =
        !query ||
        o.code.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.phone.includes(query);
      const matchesStatus = !statusFilter || o.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  function handleStatusChange(order: Order, status: OrderStatus) {
    setOrderStatus(order.id, status);
    toast.success(`Commande ${order.code} : statut mis à jour`);
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Commandes ({orders.length})</h1>

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

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Livraison</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy">{o.code}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-navy">{o.customer.name}</p>
                  <p className="text-xs text-gray-400">{o.customer.phone}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(o.total)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      o.paymentStatus === "reussi"
                        ? "bg-green-100 text-green-700"
                        : o.paymentStatus === "echoue"
                          ? "bg-red-100 text-red-600"
                          : o.paymentStatus === "annule"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{DELIVERY_LABELS[o.deliveryMode]}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o, e.target.value as OrderStatus)}
                    className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold outline-none ${STATUS_COLORS[o.status]}`}
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
    </div>
  );
}
