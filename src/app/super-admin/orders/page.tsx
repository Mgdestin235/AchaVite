"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sendDigitalDelivery } from "@/lib/digitalDelivery";
import { formatFCFA } from "@/lib/format";
import type { OrderRow } from "@/lib/db/types";

type OrderWithItems = OrderRow & {
  order_items: {
    product_id: string | null;
    products: { product_files: { name: string; url: string }[] } | null;
  }[];
};

const PAYMENT_LABELS: Record<string, string> = {
  attente: "En attente",
  reussi: "Payée",
  echoue: "Échouée",
  annule: "Annulée",
};

const PAYMENT_COLORS: Record<string, string> = {
  attente: "bg-yellow-100 text-yellow-700",
  reussi: "bg-green-100 text-green-700",
  echoue: "bg-red-100 text-red-600",
  annule: "bg-gray-100 text-gray-500",
};

export default function SuperAdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("orders")
      .select("*, order_items(product_id, products(product_files(name, url)))")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setOrders((data as unknown as OrderWithItems[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function confirmPayment(order: OrderWithItems) {
    const { error } = await supabase.from("orders").update({ payment_status: "reussi" }).eq("id", order.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Commande ${order.code} : paiement confirmé`);
    setRefreshKey((k) => k + 1);

    const files = order.order_items.flatMap((it) => it.products?.product_files ?? []);
    if (order.digital_delivered || files.length === 0) return;
    if (!order.customer_email) {
      toast.warning(`Commande ${order.code} : produit numérique mais aucun email client renseigné.`);
      return;
    }

    sendDigitalDelivery({
      email: order.customer_email,
      orderCode: order.code,
      customerName: order.customer_name,
      files: files.map((f) => ({ name: f.name, url: f.url })),
    })
      .then(async () => {
        await supabase.from("orders").update({ digital_delivered: true }).eq("id", order.id);
        toast.success(`Produit numérique envoyé à ${order.customer_email}`);
        setRefreshKey((k) => k + 1);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Échec de l'envoi du produit numérique"));
  }

  async function markFailed(order: OrderWithItems) {
    const { error } = await supabase.from("orders").update({ payment_status: "echoue" }).eq("id", order.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Commande ${order.code} : paiement marqué comme échoué`);
    setRefreshKey((k) => k + 1);
  }

  const filtered = orders.filter(
    (o) =>
      !query ||
      o.code.toLowerCase().includes(query.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Commandes ({orders.length})</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (code, client)..."
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{o.code}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-navy">{o.customer_name}</p>
                    <p className="text-xs text-gray-400">{o.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_COLORS[o.payment_status]}`}>
                      {PAYMENT_LABELS[o.payment_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.status}</td>
                  <td className="px-4 py-3">
                    {o.payment_status === "attente" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => confirmPayment(o)}
                          className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200"
                        >
                          <CheckCircle2 size={14} />
                          Valider
                        </button>
                        <button
                          onClick={() => markFailed(o)}
                          className="flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                        >
                          <XCircle size={14} />
                          Refuser
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-gray-300">—</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
