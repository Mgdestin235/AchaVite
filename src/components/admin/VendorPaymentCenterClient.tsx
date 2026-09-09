"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, QrCode, Star, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createStorePaymentMethod,
  deleteStorePaymentMethod,
  listStorePaymentMethods,
  setDefaultStorePaymentMethod,
  updateStorePaymentMethod,
} from "@/lib/db/storePaymentMethods";
import { listPaymentProvidersForCountry } from "@/lib/db/paymentProviders";
import { listCountries } from "@/lib/db/countries";
import { updateStore } from "@/lib/db/stores";
import type { Country, PaymentProviderKey, PaymentProviderRow, Store, StorePaymentMethod } from "@/lib/db/types";

const PROVIDER_META: Record<PaymentProviderKey, { badge: string; color: string }> = {
  manual: { badge: "•••", color: "bg-gray-100 text-gray-600" },
  wave: { badge: "WA", color: "bg-blue-100 text-blue-700" },
  orange_money: { badge: "OM", color: "bg-orange-100 text-orange-700" },
  mtn_momo: { badge: "MT", color: "bg-yellow-100 text-yellow-800" },
  moov_money: { badge: "MO", color: "bg-blue-100 text-blue-700" },
  airtel_money: { badge: "AI", color: "bg-red-100 text-red-700" },
  free_money: { badge: "FR", color: "bg-purple-100 text-purple-700" },
  tmoney: { badge: "TM", color: "bg-teal-100 text-teal-700" },
  flooz: { badge: "FZ", color: "bg-indigo-100 text-indigo-700" },
  bank_transfer: { badge: "", color: "bg-navy/10 text-navy" },
  card: { badge: "", color: "bg-slate-100 text-slate-700" },
  qr: { badge: "", color: "bg-gray-100 text-gray-700" },
};

function ProviderIcon({ providerKey }: { providerKey: PaymentProviderKey }) {
  if (providerKey === "bank_transfer") return <Landmark size={18} />;
  if (providerKey === "card") return <CreditCard size={18} />;
  if (providerKey === "qr") return <QrCode size={18} />;
  if (providerKey === "manual") return <Wallet size={18} />;
  return <span className="text-[10px] font-extrabold">{PROVIDER_META[providerKey].badge}</span>;
}

type FormState = { number: string; accountName: string; merchantId: string; instructions: string };
const EMPTY_FORM: FormState = { number: "", accountName: "", merchantId: "", instructions: "" };

export function VendorPaymentCenterClient({ store }: { store: Store }) {
  const supabase = createClient();
  const [countries, setCountries] = useState<Country[]>([]);
  // Local, updatable mirror of store.country_code -- the prop itself is
  // never mutated; this is what the rest of the component reads/writes.
  const [savedCountryCode, setSavedCountryCode] = useState(store.country_code ?? "");
  const [countryCode, setCountryCode] = useState(store.country_code ?? "");
  const [savingCountry, setSavingCountry] = useState(false);
  const [providers, setProviders] = useState<PaymentProviderRow[]>([]);
  const [methods, setMethods] = useState<StorePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingKey, setEditingKey] = useState<PaymentProviderKey | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    listCountries(supabase).then(setCountries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listStorePaymentMethods(supabase, store.id),
      savedCountryCode ? listPaymentProvidersForCountry(supabase, savedCountryCode) : Promise.resolve([]),
    ]).then(([m, p]) => {
      if (cancelled) return;
      setMethods(m);
      setProviders(p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, savedCountryCode, refreshKey]);

  async function handleSaveCountry() {
    if (!countryCode) return;
    setSavingCountry(true);
    const { error } = await updateStore(supabase, store.id, { country_code: countryCode });
    setSavingCountry(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Pays enregistré");
    setLoading(true);
    setSavedCountryCode(countryCode);
  }

  function methodFor(providerKey: PaymentProviderKey): StorePaymentMethod | undefined {
    return methods.find((m) => m.provider_key === providerKey);
  }

  function openConfig(provider: PaymentProviderRow) {
    const existing = methodFor(provider.provider_key);
    setForm({
      number: existing?.number ?? "",
      accountName: existing?.account_name ?? "",
      merchantId: existing?.merchant_id ?? "",
      instructions: existing?.instructions ?? "",
    });
    setEditingKey(provider.provider_key);
  }

  async function handleSaveConfig(provider: PaymentProviderRow) {
    const existing = methodFor(provider.provider_key);
    if (!form.number.trim() && !form.merchantId.trim()) {
      toast.error("Renseignez au moins un numéro ou un identifiant marchand.");
      return;
    }
    if (existing) {
      const { error } = await updateStorePaymentMethod(supabase, existing.id, {
        number: form.number || null,
        account_name: form.accountName || null,
        merchant_id: form.merchantId || null,
        instructions: form.instructions || null,
        is_active: true,
      });
      if (error) {
        toast.error(error);
        return;
      }
    } else {
      const { error } = await createStorePaymentMethod(supabase, store.id, {
        providerKey: provider.provider_key,
        label: provider.display_name,
        number: form.number,
        accountName: form.accountName,
        merchantId: form.merchantId,
        instructions: form.instructions,
      });
      if (error) {
        toast.error(error);
        return;
      }
    }
    toast.success(`${provider.display_name} configuré`);
    setEditingKey(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleToggleActive(m: StorePaymentMethod) {
    const { error } = await updateStorePaymentMethod(supabase, m.id, { is_active: !m.is_active });
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleSetDefault(m: StorePaymentMethod) {
    const { error } = await setDefaultStorePaymentMethod(supabase, m.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`${m.label} défini comme moyen principal`);
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

  const activeCount = methods.filter((m) => m.is_active).length;
  const defaultMethod = methods.find((m) => m.is_default);
  const selectedCountry = countries.find((c) => c.code === savedCountryCode);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-navy">Moyens de paiement</h1>
      <p className="mb-5 text-sm text-gray-500">
        Configurez les moyens de paiement que vos clients peuvent utiliser pour régler leurs
        commandes. Ces informations s&apos;affichent sur vos fiches produits.
      </p>

      {/* Pays et devise */}
      <div className="mb-6 rounded-xl bg-white p-4 ring-1 ring-black/5">
        <h2 className="mb-1 text-sm font-bold text-navy">Pays et devise</h2>
        <p className="mb-3 text-xs text-gray-500">
          Détermine automatiquement votre devise et les moyens de paiement proposés.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">Sélectionnez un pays...</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {selectedCountry && (
            <span className="rounded-full bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy">
              Devise : {selectedCountry.currency_code}
            </span>
          )}
          {countryCode !== savedCountryCode && (
            <button
              onClick={handleSaveCountry}
              disabled={savingCountry}
              className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy-light disabled:opacity-50"
            >
              {savingCountry ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </div>

      {!savedCountryCode ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Sélectionnez votre pays ci-dessus pour découvrir les moyens de paiement disponibles.
        </p>
      ) : loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <>
          {/* Résumé */}
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700">
              {activeCount} moyen{activeCount > 1 ? "s" : ""} de paiement actif{activeCount > 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-navy/5 px-3 py-1.5 font-semibold text-navy">
              {defaultMethod ? `Moyen principal : ${defaultMethod.label}` : "Aucun moyen principal défini"}
            </span>
          </div>

          <h2 className="mb-1 text-sm font-bold text-navy">Moyens de paiement</h2>
          <p className="mb-3 text-xs text-gray-500">
            Activez uniquement les moyens de paiement que vous souhaitez proposer à vos clients.
          </p>

          <div className="space-y-2">
            {providers.map((provider) => {
              const method = methodFor(provider.provider_key);
              const isEditing = editingKey === provider.provider_key;
              return (
                <div key={provider.provider_key} className="rounded-xl bg-white p-3 ring-1 ring-black/5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${PROVIDER_META[provider.provider_key].color}`}>
                      <ProviderIcon providerKey={provider.provider_key} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                        {provider.display_name}
                        {method?.is_default && (
                          <span className="flex items-center gap-0.5 rounded-full bg-orange-light px-1.5 py-0.5 text-[10px] font-bold text-orange-dark">
                            <Star size={9} fill="currentColor" />
                            Principal
                          </span>
                        )}
                      </p>
                      {method?.number && <p className="text-xs text-gray-400">{method.number}</p>}
                    </div>
                    {method ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(method)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            method.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {method.is_active ? "Actif" : "Inactif"}
                        </button>
                        {!method.is_default && (
                          <button
                            onClick={() => handleSetDefault(method)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-navy hover:bg-gray-50"
                          >
                            Définir principal
                          </button>
                        )}
                        <button onClick={() => openConfig(provider)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-navy hover:bg-gray-50">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(method)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openConfig(provider)}
                        className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-light"
                      >
                        + Ajouter
                      </button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-3 grid gap-2 border-t border-gray-100 pt-3 sm:grid-cols-2">
                      <input
                        value={form.number}
                        onChange={(e) => setForm({ ...form, number: e.target.value })}
                        placeholder="Numéro"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                      />
                      <input
                        value={form.accountName}
                        onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                        placeholder="Nom du titulaire"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                      />
                      <input
                        value={form.merchantId}
                        onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                        placeholder="Identifiant marchand (optionnel)"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange sm:col-span-2"
                      />
                      <textarea
                        value={form.instructions}
                        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                        placeholder="Instructions pour vos clients (optionnel)"
                        rows={2}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange sm:col-span-2"
                      />
                      <div className="flex gap-2 sm:col-span-2">
                        <button
                          onClick={() => handleSaveConfig(provider)}
                          className="rounded-lg bg-orange px-3 py-2 text-xs font-bold text-white hover:bg-orange-dark"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 ring-1 ring-black/5">
            <p className="mb-1 font-bold text-navy">Paiement automatique — bientôt disponible</p>
            Tous les moyens ci-dessus fonctionnent en paiement manuel aujourd&apos;hui : le client
            vous envoie directement le montant, puis confirme sa commande. Une intégration
            permettant une vérification automatique des paiements sera proposée ultérieurement
            pour les opérateurs compatibles.
          </div>
        </>
      )}
    </div>
  );
}
