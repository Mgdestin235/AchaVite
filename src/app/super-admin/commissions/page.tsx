"use client";

import { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/format";

export default function SuperAdminCommissionsPage() {
  const supabase = createClient();
  const [percent, setPercent] = useState("10");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: settings }, { data: orders }] = await Promise.all([
        supabase.from("platform_settings").select("commission_percent").eq("id", 1).maybeSingle(),
        supabase.from("orders").select("total, status"),
      ]);
      if (settings) setPercent(String(settings.commission_percent));
      const revenue = (orders ?? [])
        .filter((o) => o.status !== "annulee")
        .reduce((sum, o) => sum + Number(o.total), 0);
      setTotalRevenue(revenue);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({ commission_percent: Number(percent) })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Taux de commission mis à jour");
  }

  const commissionEarned = (totalRevenue * Number(percent || 0)) / 100;

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Commissions</h1>

      <form onSubmit={handleSave} className="max-w-md rounded-xl bg-white p-5 ring-1 ring-black/5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-light text-orange">
            <Percent size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-navy">Taux de commission plateforme</p>
            <p className="text-xs text-gray-500">Appliqué sur chaque vente réalisée par les vendeurs.</p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">Pourcentage (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />

        {!loading && (
          <div className="mt-4 space-y-1 rounded-lg bg-navy/5 p-3 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Chiffre d&apos;affaires plateforme</span>
              <span className="font-semibold text-navy">{formatFCFA(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Commissions estimées</span>
              <span className="font-semibold text-orange">{formatFCFA(commissionEarned)}</span>
            </div>
          </div>
        )}

        <button
          disabled={saving}
          className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
