import Link from "next/link";
import { ArrowRight, Calendar, Check, Crown, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import { formatFCFA } from "@/lib/format";

export const metadata = { title: "Nos offres vendeur" };
// Must always reflect the Super Admin's live is_active toggle -- without
// this, Next's fetch Data Cache can keep serving a stale snapshot of
// subscription_plans from the first render even though the route itself
// is dynamically rendered per-request.
export const revalidate = 0;

const FREE_FALLBACK = [
  "Boutique en ligne",
  "Ajout de produits illimité",
  "Réception de commandes",
  "Découverte de la plateforme",
  "Support standard",
];
const PRO_FALLBACK = [
  "Toutes les fonctionnalités du Mode Free",
  "Mise en avant de votre boutique",
  "Statistiques avancées",
  "Outils pour booster vos ventes",
  "Support prioritaire",
];

export default async function VendorOffersPage() {
  const supabase = await createClient();
  const [trialPlan, proPlan] = await Promise.all([
    getActivePlan(supabase, "trial"),
    getActivePlan(supabase, "pro_monthly"),
  ]);
  const trialMonths = trialPlan ? Math.round(trialPlan.duration_days / 30) : 3;
  // A missing plan row fails safe toward "payment required" (matches the
  // existing hardcoded-fallback price behavior below).
  const trialRequiresPayment = trialPlan ? trialPlan.is_active : true;
  const proRequiresPayment = proPlan ? proPlan.is_active : true;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-navy">Nos offres vendeur</h1>
      <p className="mt-1 text-sm text-gray-500">
        Choisissez votre formule pour commencer à vendre sur AchaVite.
      </p>
      {(trialRequiresPayment || proRequiresPayment) && (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-navy/5 px-3 py-2 text-xs font-medium text-navy">
          <ShieldCheck size={14} className="shrink-0 text-orange" />
          Le paiement est requis avant la création de votre compte vendeur pour les offres marquées
          « Paiement requis ».
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Mode Free */}
        <div className="flex flex-col rounded-2xl bg-blue-50 p-5 ring-1 ring-black/5">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
              Mode Free — Essai
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100">
              <Calendar size={11} />
              {trialMonths} mois
            </span>
          </div>
          <span
            className={`mb-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trialRequiresPayment ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-700"
            }`}
          >
            {trialRequiresPayment ? "Paiement requis" : "Accès gratuit"}
          </span>
          <p className="text-2xl font-extrabold text-navy">
            {trialPlan ? formatFCFA(Number(trialPlan.price)) : "5 500 FCFA"}
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Testez AchaVite pendant {trialMonths} mois et commencez à développer votre activité.
          </p>
          <ul className="mb-5 flex-1 space-y-1.5 text-xs text-gray-600">
            {(trialPlan?.features?.length ? trialPlan.features : FREE_FALLBACK).map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={trialRequiresPayment ? "/vendeur/paiement?offre=free" : "/vendeur/creation-compte?offre=free"}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-3 text-sm font-bold text-white hover:bg-navy-light"
          >
            Choisir le Mode Free
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mode Pro */}
        <div className="flex flex-col rounded-2xl bg-orange-light p-5 ring-2 ring-orange">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-dark">
              Mode Pro
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-orange-dark ring-1 ring-orange/20">
              <Crown size={11} />
              Pro
            </span>
          </div>
          <span
            className={`mb-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
              proRequiresPayment ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-700"
            }`}
          >
            {proRequiresPayment ? "Paiement requis" : "Accès gratuit"}
          </span>
          <p className="text-2xl font-extrabold text-navy">
            {proPlan ? `${formatFCFA(Number(proPlan.price))} / mois` : "15 000 FCFA / mois"}
          </p>
          <p className="mb-3 text-xs text-gray-500">
            Passez à la version professionnelle pour développer davantage vos ventes.
          </p>
          <ul className="mb-5 flex-1 space-y-1.5 text-xs text-gray-600">
            {(proPlan?.features?.length ? proPlan.features : PRO_FALLBACK).map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={proRequiresPayment ? "/vendeur/paiement?offre=pro" : "/vendeur/creation-compte?offre=pro"}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-orange px-3 py-3 text-sm font-bold text-white hover:bg-orange-dark"
          >
            Choisir le Mode Pro
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Vous avez déjà un compte vendeur ?{" "}
        <Link href="/admin/connexion" className="font-semibold text-navy underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
