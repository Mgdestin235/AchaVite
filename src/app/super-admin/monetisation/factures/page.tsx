"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listAllInvoices, type InvoiceWithStore } from "@/lib/db/invoices";
import { formatFCFA } from "@/lib/format";

export default function FacturesPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<InvoiceWithStore[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listAllInvoices(supabase).then((data) => {
      if (cancelled) return;
      setInvoices(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = invoices.filter(
    (i) =>
      !query ||
      i.invoice_number.toLowerCase().includes(query.toLowerCase()) ||
      (i.stores?.name ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (n° facture, boutique)..."
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">Aucune facture.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">N° facture</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{i.invoice_number}</td>
                  <td className="px-4 py-3 text-navy">{i.stores?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(Number(i.amount))}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {i.period_start ?? "—"} → {i.period_end ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(i.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
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
