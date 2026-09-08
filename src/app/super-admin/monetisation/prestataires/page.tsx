"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { listPaymentProviders, setPaymentProviderActive } from "@/lib/db/paymentProviders";
import type { PaymentProviderRow } from "@/lib/db/types";

export default function PrestatairesPage() {
  const supabase = createClient();
  const [providers, setProviders] = useState<PaymentProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listPaymentProviders(supabase).then((data) => {
      if (cancelled) return;
      setProviders(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleToggle(p: PaymentProviderRow) {
    if (!p.is_configured) {
      toast.error("Ce prestataire n'a pas encore d'intégration API réelle — impossible de l'activer pour l'instant.");
      return;
    }
    const { error } = await setPaymentProviderActive(supabase, p.provider_key, !p.is_active);
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-sm text-gray-500">
        Seule la confirmation manuelle (WhatsApp) est réellement intégrée aujourd&apos;hui. Les
        autres prestataires apparaissent ici pour montrer que l&apos;architecture est prête à les
        accueillir, dès qu&apos;un vrai compte API sera configuré.
      </p>
      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.provider_key} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{p.display_name}</p>
                <p className="text-xs text-gray-400">{p.notes}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  p.is_configured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.is_configured ? "Configuré" : "Non configuré"}
              </span>
              <button
                onClick={() => handleToggle(p)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  p.is_active ? "bg-orange text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.is_active ? "Actif" : "Inactif"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
