"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createPlatformPaymentMethod,
  deletePlatformPaymentMethod,
  listPlatformPaymentMethods,
  updatePlatformPaymentMethod,
} from "@/lib/db/platformPaymentMethods";
import { listCountries } from "@/lib/db/countries";
import type { Country, PaymentProviderKey, PlatformPaymentMethod } from "@/lib/db/types";

const PROVIDER_OPTIONS: { value: PaymentProviderKey; label: string }[] = [
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_momo", label: "MTN Mobile Money" },
  { value: "moov_money", label: "Moov Money" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "manual", label: "Autre / virement bancaire" },
];

const EMPTY = {
  countryCode: "",
  providerKey: "wave" as PaymentProviderKey,
  label: "",
  number: "",
  paymentLink: "",
  beneficiaryName: "",
  currencyCode: "XOF",
  instructions: "",
};

export default function MoyensDePaiementPage() {
  const supabase = createClient();
  const [methods, setMethods] = useState<PlatformPaymentMethod[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listPlatformPaymentMethods(supabase), listCountries(supabase)]).then(([m, c]) => {
      if (cancelled) return;
      setMethods(m);
      setCountries(c);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error("Merci de renseigner un nom.");
      return;
    }
    const { error } = await createPlatformPaymentMethod(supabase, { ...form, countryCode: form.countryCode || null });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Moyen de paiement ajouté");
    setForm(EMPTY);
    setRefreshKey((k) => k + 1);
  }

  async function handleToggle(m: PlatformPaymentMethod) {
    const { error } = await updatePlatformPaymentMethod(supabase, m.id, { is_active: !m.is_active });
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(m: PlatformPaymentMethod) {
    if (!confirm(`Supprimer « ${m.label} » ?`)) return;
    const { error } = await deletePlatformPaymentMethod(supabase, m.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Moyen de paiement supprimé");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-gray-500">
        Ces moyens de paiement servent à collecter les frais d&apos;abonnement des vendeurs (essai et
        PRO) — distincts des moyens de paiement des commandes clients, configurés dans
        « Paiements » (menu principal).
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
        <select
          value={form.countryCode}
          onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="">Tous pays</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Nom affiché"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={form.currencyCode}
          onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
          placeholder="Devise (ex: XOF)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
          placeholder="Numéro"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={form.beneficiaryName}
          onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
          placeholder="Nom du bénéficiaire"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          value={form.paymentLink}
          onChange={(e) => setForm({ ...form, paymentLink: e.target.value })}
          placeholder="Lien de paiement (optionnel)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
        />
        <textarea
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="Instructions de paiement"
          rows={2}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
        />
        <button className="flex items-center justify-center gap-2 rounded-lg bg-orange px-3 py-2.5 text-sm font-bold text-white hover:bg-orange-dark sm:col-span-2">
          <Plus size={16} />
          Ajouter
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">
                  {m.label} {m.country_code && <span className="text-xs text-gray-400">({m.country_code})</span>}
                </p>
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
