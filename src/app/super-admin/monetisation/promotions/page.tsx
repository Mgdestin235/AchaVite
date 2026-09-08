"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createSubscriptionPromotion,
  deleteSubscriptionPromotion,
  listSubscriptionPromotions,
  updateSubscriptionPromotionActive,
} from "@/lib/db/subscriptionPromotions";
import { listPlans } from "@/lib/db/subscriptionPlans";
import type { SubscriptionPlan, SubscriptionPromotion } from "@/lib/db/types";

const EMPTY = {
  code: "",
  planId: "",
  discountType: "percent" as "percent" | "amount",
  discountValue: 10,
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  maxUses: 100,
};

export default function MonetisationPromotionsPage() {
  const supabase = createClient();
  const [promotions, setPromotions] = useState<SubscriptionPromotion[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listSubscriptionPromotions(supabase), listPlans(supabase)]).then(([p, pl]) => {
      if (cancelled) return;
      setPromotions(p);
      setPlans(pl);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  function planName(id: string | null) {
    if (!id) return "Tous les plans";
    return plans.find((p) => p.id === id)?.name ?? "—";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Merci de renseigner un code.");
      return;
    }
    if (promotions.some((p) => p.code.toLowerCase() === form.code.toLowerCase())) {
      toast.error("Ce code promo existe déjà.");
      return;
    }
    const { error } = await createSubscriptionPromotion(supabase, {
      code: form.code.toUpperCase().trim(),
      plan_id: form.planId || null,
      discount_percent: form.discountType === "percent" ? form.discountValue : null,
      discount_amount: form.discountType === "amount" ? form.discountValue : null,
      starts_at: form.startsAt,
      ends_at: form.endsAt,
      max_uses: form.maxUses,
    });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Code promo créé");
    setForm(EMPTY);
    setRefreshKey((k) => k + 1);
  }

  async function handleToggleActive(p: SubscriptionPromotion) {
    const { error } = await updateSubscriptionPromotionActive(supabase, p.id, !p.active);
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(p: SubscriptionPromotion) {
    if (!confirm(`Supprimer le code ${p.code} ?`)) return;
    const { error } = await deleteSubscriptionPromotion(supabase, p.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Code promo supprimé");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        Codes promo applicables aux abonnements vendeurs (essai ou PRO) — distincts des codes promo
        clients configurés par chaque boutique.
      </p>

      <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5 sm:grid-cols-6">
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Code (ex: LANCEMENT20)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
        />
        <select
          value={form.planId}
          onChange={(e) => setForm({ ...form, planId: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="">Tous les plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={form.discountType}
          onChange={(e) => setForm({ ...form, discountType: e.target.value as "percent" | "amount" })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="percent">Pourcentage</option>
          <option value="amount">Montant fixe</option>
        </select>
        <input
          type="number"
          min={0}
          max={form.discountType === "percent" ? 100 : undefined}
          value={form.discountValue}
          onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
          placeholder="Valeur"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="number"
          min={1}
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
          placeholder="Utilisations max"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="date"
          value={form.startsAt}
          onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="date"
          value={form.endsAt}
          onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button className="flex items-center justify-center gap-2 rounded-lg bg-orange px-3 py-2.5 text-sm font-bold text-white hover:bg-orange-dark sm:col-span-2">
          <Plus size={16} />
          Créer le code
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : promotions.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">Aucun code promo.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Réduction</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Utilisation</th>
                <th className="px-4 py-3">Actif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-bold text-navy">{p.code}</td>
                  <td className="px-4 py-3 text-gray-500">{planName(p.plan_id)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.discount_percent != null ? `${p.discount_percent}%` : `${p.discount_amount} FCFA`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.starts_at).toLocaleDateString("fr-FR")} → {new Date(p.ends_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.used} / {p.max_uses}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
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
