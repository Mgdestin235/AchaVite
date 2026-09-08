"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { confirmSubscriptionPayment, listAllSubscriptionPayments, type SubscriptionPaymentWithStore } from "@/lib/db/subscriptionPayments";
import { formatFCFA } from "@/lib/format";

const KIND_LABELS: Record<string, string> = {
  trial: "Essai",
  pro_subscription: "Abonnement PRO",
  renewal: "Renouvellement",
  refund: "Remboursement",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  success: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
  refunded: "bg-gray-100 text-gray-500",
};

export default function MonetisationPaiementsPage() {
  const supabase = createClient();
  const [payments, setPayments] = useState<SubscriptionPaymentWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listAllSubscriptionPayments(supabase).then((data) => {
      if (cancelled) return;
      setPayments(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleConfirm(paymentId: string) {
    const { error } = await confirmSubscriptionPayment(supabase, paymentId);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Paiement confirmé, abonnement activé et facture générée");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : payments.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">Aucun paiement.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{p.stores?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{KIND_LABELS[p.kind] ?? p.kind}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(Number(p.amount))}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === "pending" ? (
                      <button
                        onClick={() => handleConfirm(p.id)}
                        className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200"
                      >
                        <CheckCircle2 size={14} />
                        Valider
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
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
