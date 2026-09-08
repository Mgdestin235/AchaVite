"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Store as StoreIcon, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MfaEnroll } from "./MfaEnroll";

export function VendorSecurityClient() {
  const supabase = createClient();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (cancelled) return;
      setMfaEnabled((data?.totp.length ?? 0) > 0);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDone() {
    setEnrolling(false);
    setMfaEnabled(true);
    toast.success("Double authentification activée");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-navy">Paramètres</h1>

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
            <StoreIcon size={20} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Boutique & livraison</h2>
            <p className="text-xs text-gray-500">
              Le nom, le logo, le numéro WhatsApp et les zones de livraison de votre boutique se
              gèrent depuis leurs pages dédiées.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/store"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-gray-50"
          >
            Ma boutique
          </Link>
          <Link
            href="/admin/livraison"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-gray-50"
          >
            Zones de livraison
          </Link>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
            <CreditCard size={20} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Moyens de paiement</h2>
            <p className="text-xs text-gray-500">
              Le paiement des commandes de vos clients reste collecté par AchaVite (qui vous
              reverse ensuite votre part) — cela ne change pas. Vous pouvez en plus indiquer sur
              vos fiches produits les moyens de paiement que vous acceptez directement (Orange
              Money, Wave, espèces à la livraison...), à titre informatif pour vos clients.
            </p>
          </div>
        </div>
        <Link
          href="/admin/parametres/paiement"
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy hover:bg-gray-50"
        >
          Gérer mes moyens de paiement
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-white">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Double authentification (2FA)</h2>
            <p className="text-xs text-gray-500">Protège l&apos;accès à votre compte vendeur.</p>
          </div>
        </div>

        {mfaEnabled === null ? (
          <p className="text-sm text-gray-400">Vérification en cours...</p>
        ) : enrolling ? (
          <MfaEnroll onDone={handleDone} />
        ) : mfaEnabled ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
            <ShieldCheck size={16} />
            2FA activé sur ce compte
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2.5 text-sm font-semibold text-yellow-700">
              <ShieldAlert size={16} />
              2FA non activé — activez-le pour sécuriser votre compte
            </div>
            <button
              onClick={() => setEnrolling(true)}
              className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark"
            >
              Activer le 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
