"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/format";
import type { OrderRow } from "@/lib/db/types";

export default function SuperAdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders((data as OrderRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
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
                  <td className="px-4 py-3 text-gray-500">{o.payment_status}</td>
                  <td className="px-4 py-3 text-gray-500">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
