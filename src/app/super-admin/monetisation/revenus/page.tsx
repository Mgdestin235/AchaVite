"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Wallet, TrendingUp, Users, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRevenueSummary, type RevenueSummary } from "@/lib/db/subscriptionPayments";
import { listSubscriptions } from "@/lib/db/subscriptions";
import { formatFCFA } from "@/lib/format";
import { StatCard } from "@/components/admin/StatCard";

const COLORS = ["#0B1F3A", "#FF7A1A", "#22C55E", "#EF4444", "#9CA3AF"];

export default function RevenusPage() {
  const supabase = createClient();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRevenueSummary(supabase), listSubscriptions(supabase)]).then(([rev, subs]) => {
      if (cancelled) return;
      setSummary(rev);
      const grouped: Record<string, number> = {};
      for (const s of subs) grouped[s.status] = (grouped[s.status] ?? 0) + 1;
      setCounts(grouped);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !summary) return <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>;

  const trialActive = counts.trial_active ?? 0;
  const proActive = counts.pro_active ?? 0;
  const trialExpired = counts.trial_expired ?? 0;
  const conversionRate = trialActive + trialExpired + proActive > 0
    ? Math.round((proActive / (trialActive + trialExpired + proActive)) * 100)
    : 0;

  const pieData = [
    { name: "Essai actif", value: trialActive },
    { name: "PRO actif", value: proActive },
    { name: "Essai expiré", value: trialExpired },
    { name: "PRO expiré", value: counts.pro_expired ?? 0 },
    { name: "Suspendu/Annulé", value: (counts.suspended ?? 0) + (counts.cancelled ?? 0) },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Revenus aujourd'hui" value={formatFCFA(summary.today)} icon={Wallet} tone="orange" />
        <StatCard label="Revenus (7 jours)" value={formatFCFA(summary.last7Days)} icon={TrendingUp} tone="navy" />
        <StatCard label="Revenus (30 jours)" value={formatFCFA(summary.last30Days)} icon={TrendingUp} tone="navy" />
        <StatCard label="Revenus (année)" value={formatFCFA(summary.thisYear)} icon={Wallet} tone="orange" />
        <StatCard label="Revenus essais (total)" value={formatFCFA(summary.totalTrial)} icon={Users} tone="navy" />
        <StatCard label="Revenus PRO (total)" value={formatFCFA(summary.totalPro)} icon={Users} tone="navy" />
        <StatCard label="Paiements réussis" value={String(summary.successCount)} icon={CheckCircle2} tone="green" />
        <StatCard label="Paiements échoués" value={String(summary.failedCount)} icon={XCircle} tone="red" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h2 className="mb-1 text-sm font-bold text-navy">Répartition des abonnements</h2>
          <p className="mb-4 text-xs text-gray-400">
            {trialActive} essai{trialActive > 1 ? "s" : ""} actif{trialActive > 1 ? "s" : ""} · {proActive} PRO actif{proActive > 1 ? "s" : ""}
          </p>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Aucune donnée pour le moment.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <h2 className="mb-4 text-sm font-bold text-navy">Taux de conversion Essai → PRO</h2>
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-4xl font-extrabold text-orange">{conversionRate}%</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={13} />
              Basé sur {trialActive + trialExpired + proActive} boutique{trialActive + trialExpired + proActive > 1 ? "s" : ""} ayant démarré un essai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
