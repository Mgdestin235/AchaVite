"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { setSubscriptionStatus } from "@/lib/db/subscriptions";
import { listAllSubscriptionPayments } from "@/lib/db/subscriptionPayments";
import { daysUntil } from "@/lib/payments/pricing";
import type { Subscription, SubscriptionStatus } from "@/lib/db/types";

type SubscriptionWithStore = Subscription & { stores: { name: string; profiles: { name: string | null } | null } | null };

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial_pending: "Free non activé",
  trial_active: "Free actif",
  trial_expired: "Free expiré",
  pro_active: "PRO actif",
  pro_expired: "PRO expiré",
  payment_pending: "Paiement en attente",
  payment_failed: "Paiement échoué",
  suspended: "Suspendu",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trial_pending: "bg-navy/10 text-navy",
  trial_active: "bg-green-100 text-green-700",
  trial_expired: "bg-red-100 text-red-600",
  pro_active: "bg-orange-light text-orange-dark",
  pro_expired: "bg-red-100 text-red-600",
  payment_pending: "bg-yellow-100 text-yellow-700",
  payment_failed: "bg-red-100 text-red-600",
  suspended: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-600",
};

// "Expire bientôt" isn't a stored status -- it's trial_active/pro_active
// with 7 days or fewer left, computed live like the vendor portal does.
const EXPIRING_SOON = "__expiring_soon__" as const;
type FilterValue = SubscriptionStatus | typeof EXPIRING_SOON | "";

export default function AbonnementsPage() {
  const supabase = createClient();
  const [subs, setSubs] = useState<SubscriptionWithStore[]>([]);
  const [lastPaymentByStore, setLastPaymentByStore] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let query = supabase
      .from("subscriptions")
      .select("*, stores(name, profiles(name))")
      .order("created_at", { ascending: false });
    if (filter && filter !== EXPIRING_SOON) query = query.eq("status", filter);

    Promise.all([query, listAllSubscriptionPayments(supabase, { status: "success" })]).then(([{ data }, payments]) => {
      if (cancelled) return;
      setSubs((data as unknown as SubscriptionWithStore[]) ?? []);
      const latest = new Map<string, string>();
      for (const p of payments) {
        if (!latest.has(p.store_id) || p.created_at > (latest.get(p.store_id) ?? "")) {
          latest.set(p.store_id, p.created_at);
        }
      }
      setLastPaymentByStore(latest);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  const visible = useMemo(() => {
    if (filter !== EXPIRING_SOON) return subs;
    return subs.filter((sub) => {
      if (sub.status !== "trial_active" && sub.status !== "pro_active") return false;
      const expiry = sub.status === "pro_active" ? sub.current_period_end : sub.trial_expires_at;
      const remaining = daysUntil(expiry);
      return remaining !== null && remaining >= 0 && remaining <= 7;
    });
  }, [subs, filter]);

  // "Réactiver" restores whichever status the store's real dates still
  // support -- never a bare "trial_active"/"pro_active" with no expiry,
  // which would grant free, permanent access invisible to the revenue
  // stats and never re-expirable by the cron (security-report-
  // monetization.md / bug-report MON-007).
  function reactivationTarget(sub: Subscription): SubscriptionStatus {
    const now = Date.now();
    if (sub.current_period_end && new Date(sub.current_period_end).getTime() > now) return "pro_active";
    if (sub.trial_expires_at && new Date(sub.trial_expires_at).getTime() > now) return "trial_active";
    return "trial_pending";
  }

  async function handleSetStatus(sub: Subscription, status: SubscriptionStatus) {
    const { error } = await setSubscriptionStatus(supabase, sub.id, status);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Statut mis à jour");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as FilterValue)}
        className="mb-4 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      >
        <option value="">Tous les statuts</option>
        <option value={EXPIRING_SOON}>Expire bientôt (≤ 7 jours)</option>
        {(Object.keys(STATUS_LABELS) as SubscriptionStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">Aucun abonnement.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Vendeur</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3">Dernier paiement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((sub) => {
                const expiry = sub.status === "pro_active" ? sub.current_period_end : sub.trial_expires_at;
                const remaining = daysUntil(expiry);
                const lastPayment = lastPaymentByStore.get(sub.store_id);
                return (
                  <tr key={sub.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-600">{sub.stores?.profiles?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-navy">{sub.stores?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[sub.status]}`}>
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {expiry ? `${new Date(expiry).toLocaleDateString("fr-FR")} (${remaining}j)` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {lastPayment ? new Date(lastPayment).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {sub.status !== "suspended" && (
                          <button
                            onClick={() => handleSetStatus(sub, "suspended")}
                            className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                          >
                            Suspendre
                          </button>
                        )}
                        {sub.status !== "cancelled" && (
                          <button
                            onClick={() => handleSetStatus(sub, "cancelled")}
                            className="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                          >
                            Annuler
                          </button>
                        )}
                        {(sub.status === "suspended" || sub.status === "cancelled") && (
                          <button
                            onClick={() => handleSetStatus(sub, reactivationTarget(sub))}
                            className="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200"
                          >
                            Réactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
