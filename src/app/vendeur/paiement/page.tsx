"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import { listPlatformPaymentMethods } from "@/lib/db/platformPaymentMethods";
import { createVendorApplication } from "@/lib/db/vendorApplications";
import { formatFCFA } from "@/lib/format";
import type { PlatformPaymentMethod, SubscriptionPlan } from "@/lib/db/types";

export default function VendorPaymentPage() {
  return (
    <Suspense>
      <VendorPaymentForm />
    </Suspense>
  );
}

function VendorPaymentForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isPro = searchParams.get("offre") === "pro";
  const planCode = isPro ? "pro_monthly" : "trial";

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [methods, setMethods] = useState<PlatformPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getActivePlan(supabase, planCode), listPlatformPaymentMethods(supabase, { activeOnly: true })]).then(
      ([p, m]) => {
        if (cancelled) return;
        setPlan(p);
        setMethods(m);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCode]);

  async function handleDeclare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) {
      toast.error("Renseignez votre e-mail et votre téléphone.");
      return;
    }
    setSubmitting(true);
    const { error } = await createVendorApplication(supabase, {
      email,
      phone,
      planCode,
      amount: Number(plan?.price ?? (isPro ? 15000 : 5500)),
      currencyCode: plan?.currency_code ?? "XOF",
      reference,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    setDeclared(true);
  }

  const amountLabel = plan ? formatFCFA(Number(plan.price)) : isPro ? "15 000 FCFA" : "5 500 FCFA";

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <Loader2 size={28} className="mx-auto animate-spin text-navy" />
      </div>
    );
  }

  if (declared) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <CheckCircle2 size={32} className="mb-3 text-green-600" />
          <h1 className="text-lg font-bold text-navy">Paiement déclaré</h1>
          <p className="mt-2 text-sm text-gray-600">
            Notre équipe vérifie votre paiement de <strong>{amountLabel}</strong>. Une fois confirmé,
            vous recevrez par WhatsApp (au {phone}) un <strong>code d&apos;accès</strong> à usage
            unique pour créer votre compte vendeur.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Tant que le paiement n&apos;est pas confirmé, aucun compte n&apos;est créé.
          </p>
          <Link
            href="/vendeur/creation-compte"
            className="mt-5 block rounded-xl bg-orange py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
          >
            J&apos;ai reçu mon code — créer mon compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-navy">
        Paiement — {isPro ? "Mode Pro" : "Mode Free (essai)"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Montant à régler : <strong className="text-navy">{amountLabel}</strong>
        {isPro ? " / mois" : ` pour ${plan ? Math.round(plan.duration_days / 30) : 3} mois`}.
      </p>

      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="mb-2 text-sm font-bold text-navy">1. Effectuez le paiement</h2>
        {methods.length === 0 ? (
          <p className="text-xs text-gray-500">
            Les moyens de paiement ne sont pas encore configurés. Contactez l&apos;équipe AchaVite.
          </p>
        ) : (
          <div className="space-y-2">
            {methods.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                <p className="font-semibold text-navy">{m.label}</p>
                {m.number && <p className="text-gray-600">Numéro : {m.number}</p>}
                {m.beneficiary_name && <p className="text-xs text-gray-400">Bénéficiaire : {m.beneficiary_name}</p>}
                {m.instructions && <p className="mt-1 text-xs text-gray-500">{m.instructions}</p>}
                {m.payment_link && (
                  <a
                    href={m.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-orange"
                  >
                    Payer via le lien <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleDeclare} className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h2 className="mb-3 text-sm font-bold text-navy">2. Déclarez votre paiement</h2>
        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Votre adresse e-mail"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="Votre numéro WhatsApp (pour recevoir le code)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Référence de la transaction (optionnel)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        <button
          disabled={submitting}
          className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {submitting ? "Envoi..." : "J'ai effectué le paiement"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Utilisez la même adresse e-mail lors de la création de votre compte.
        </p>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        <Link href="/vendeur/offres" className="font-semibold text-navy underline">
          Retour aux offres
        </Link>
      </p>
    </div>
  );
}
