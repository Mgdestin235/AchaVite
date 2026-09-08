"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createStorePaymentMethod,
  deleteStorePaymentMethod,
  listStorePaymentMethods,
  updateStorePaymentMethod,
} from "@/lib/db/storePaymentMethods";
import type { PaymentProviderKey, StorePaymentMethod } from "@/lib/db/types";

const PROVIDER_OPTIONS: { value: PaymentProviderKey; label: string }[] = [
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "mtn_momo", label: "MTN Mobile Money" },
  { value: "moov_money", label: "Moov Money" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "manual", label: "Autre (espèces, virement, etc.)" },
];

const EMPTY = { providerKey: "orange_money" as PaymentProviderKey, label: "", number: "", instructions: "" };

export function StorePaymentMethodsClient({ storeId }: { storeId: string }) {
  const supabase = createClient();
  const [methods, setMethods] = useState<StorePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    listStorePaymentMethods(supabase, storeId).then((data) => {
      if (cancelled) return;
      setMethods(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, refreshKey]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error("Merci de renseigner un nom pour ce moyen de paiement.");
      return;
    }
    const { error } = await createStorePaymentMethod(supabase, storeId, form);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Moyen de paiement ajouté");
    setForm(EMPTY);
    setRefreshKey((k) => k + 1);
  }

  async function handleToggle(m: StorePaymentMethod) {
    const { error } = await updateStorePaymentMethod(supabase, m.id, { is_active: !m.is_active });
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(m: StorePaymentMethod) {
    if (!confirm(`Supprimer « ${m.label} » ?`)) return;
    const { error } = await deleteStorePaymentMethod(supabase, m.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Moyen de paiement supprimé");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-navy">Moyens de paiement</h1>
      <p className="mb-5 text-sm text-gray-500">
        Choisissez comment vos clients peuvent vous payer directement. Ces informations
        s&apos;affichent sur vos fiches produits.
      </p>

      <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5 sm:grid-cols-2">
        <select
          value={form.providerKey}
          onChange={(e) => setForm({ ...form, providerKey: e.target.value as PaymentProviderKey })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        >
          {PROVIDER_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Nom affiché (ex: Orange Money)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
          placeholder="Numéro (optionnel)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="Instructions (optionnel)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button className="flex items-center justify-center gap-2 rounded-lg bg-orange px-3 py-2.5 text-sm font-bold text-white hover:bg-orange-dark sm:col-span-2">
          <Plus size={16} />
          Ajouter
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : methods.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Aucun moyen de paiement configuré. Vos clients ne verront aucune option de paiement direct sur vos fiches produits.
        </p>
      ) : (
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">{m.label}</p>
                {m.number && <p className="text-xs text-gray-400">{m.number}</p>}
              </div>
              <button
                onClick={() => handleToggle(m)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  m.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {m.is_active ? "Actif" : "Inactif"}
              </button>
              <button onClick={() => handleDelete(m)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
