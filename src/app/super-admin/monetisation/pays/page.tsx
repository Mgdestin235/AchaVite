"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { listCountries, listCurrencies, updateCountry } from "@/lib/db/countries";
import type { Country, Currency } from "@/lib/db/types";

export default function PaysPage() {
  const supabase = createClient();
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCountries(supabase), listCurrencies(supabase)]).then(([c, cur]) => {
      if (cancelled) return;
      setCountries(c);
      setCurrencies(cur);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleToggle(c: Country) {
    const { error } = await updateCountry(supabase, c.code, { is_active: !c.is_active });
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleCurrencyChange(c: Country, currency_code: string) {
    const { error } = await updateCountry(supabase, c.code, { currency_code });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Devise mise à jour");
    setRefreshKey((k) => k + 1);
  }

  async function handlePhonePrefixChange(c: Country, phone_prefix: string) {
    const { error } = await updateCountry(supabase, c.code, { phone_prefix });
    if (error) {
      toast.error(error);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        Pays où AchaVite est disponible — la devise détermine les montants affichés aux boutiques de
        ce pays, le préfixe téléphonique sert à normaliser les numéros de contact.
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Devise</th>
                <th className="px-4 py-3">Préfixe tél.</th>
                <th className="px-4 py-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.code} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">
                    {c.name} <span className="text-xs text-gray-400">({c.code})</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.currency_code}
                      onChange={(e) => handleCurrencyChange(c, e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-orange"
                    >
                      {currencies.map((cur) => (
                        <option key={cur.code} value={cur.code}>{cur.code}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      defaultValue={c.phone_prefix ?? ""}
                      onBlur={(e) => handlePhonePrefixChange(c, e.target.value)}
                      placeholder="+225"
                      className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-orange"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.is_active ? "Actif" : "Inactif"}
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
