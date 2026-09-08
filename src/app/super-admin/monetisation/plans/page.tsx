"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { listPlans, updatePlan } from "@/lib/db/subscriptionPlans";
import type { SubscriptionPlan } from "@/lib/db/types";

export default function PlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listPlans(supabase).then((data) => {
      if (cancelled) return;
      setPlans(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleSave(plan: SubscriptionPlan, patch: Partial<SubscriptionPlan>) {
    const { error } = await updatePlan(supabase, plan.id, patch);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Offre "${plan.name}" mise à jour`);
    setRefreshKey((k) => k + 1);
  }

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-gray-500">
        Ces valeurs sont lues en direct par la page d&apos;accueil et le flux d&apos;abonnement vendeur —
        aucun prix n&apos;est codé en dur dans l&apos;application.
      </p>
      {plans.map((plan) => (
        <PlanForm key={plan.id} plan={plan} onSave={(patch) => handleSave(plan, patch)} />
      ))}
    </div>
  );
}

function PlanForm({ plan, onSave }: { plan: SubscriptionPlan; onSave: (patch: Partial<SubscriptionPlan>) => void }) {
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [durationDays, setDurationDays] = useState(String(plan.duration_days));
  const [features, setFeatures] = useState(plan.features.join("\n"));
  const [isActive, setIsActive] = useState(plan.is_active);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      price: Number(price) || 0,
      duration_days: Number(durationDays) || plan.duration_days,
      features: features.split("\n").map((f) => f.trim()).filter(Boolean),
      is_active: isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-bold uppercase text-navy">{plan.code}</span>
        <label className="flex items-center gap-2 text-xs font-semibold text-navy">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-orange" />
          Actif
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l'offre"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-3"
        />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Prix (FCFA)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="number"
          min={1}
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
          placeholder="Durée (jours)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <span className="flex items-center text-xs text-gray-400">{plan.currency_code}</span>
      </div>
      <textarea
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        placeholder="Fonctionnalités incluses (une par ligne)"
        rows={4}
        className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
      />
      <button className="mt-3 w-full rounded-xl bg-orange py-2.5 text-sm font-bold text-white hover:bg-orange-dark sm:w-auto sm:px-6">
        Enregistrer
      </button>
    </form>
  );
}
