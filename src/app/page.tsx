import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ShoppingCart,
  Store,
  ArrowRight,
  ShieldCheck,
  Check,
  User,
  FileText,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import { formatFCFA } from "@/lib/format";

const STEPS = [
  { number: 1, icon: ShoppingCart, tint: "bg-blue-50 text-blue-600", badge: "bg-blue-600", title: "Acheter", text: "Trouvez et commandez vos produits" },
  { number: 2, icon: Store, tint: "bg-orange-light text-orange-dark", badge: "bg-orange", title: "Vendre", text: "Créez votre boutique et vendez en Afrique" },
  { number: 3, icon: Truck, tint: "bg-blue-50 text-blue-600", badge: "bg-blue-600", title: "Suivre", text: "Suivez vos commandes en temps réel" },
] as const;

export default async function LandingPage() {
  const supabase = await createClient();
  const [trialPlan, proPlan] = await Promise.all([
    getActivePlan(supabase, "trial"),
    getActivePlan(supabase, "pro_monthly"),
  ]);

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Image src="/brand/logo-icon.png" alt="" width={44} height={34} priority className="h-8 w-auto" />
          <span className="text-lg font-extrabold text-navy">
            Acha<span className="text-orange">Vite</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/panier"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange text-white shadow-sm"
            aria-label="Panier"
          >
            <ShoppingCart size={16} />
          </Link>
          <Link
            href="/connexion"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy"
            aria-label="Se connecter"
          >
            <User size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden bg-navy px-4 pb-16 pt-8 sm:px-6">
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full"
          viewBox="0 0 500 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 60 C 150 20, 320 80, 500 30 L 500 100 L 0 100 Z" fill="var(--color-navy-light)" opacity="0.6" />
          <path d="M260 100 C 330 50, 430 40, 500 65 L 500 100 Z" fill="var(--color-orange)" />
        </svg>
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Bienvenue sur Acha<span className="text-orange">Vite</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/70">La marketplace 100% africaine</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* CTA cards */}
        <div className="relative z-10 -mt-9 grid grid-cols-2 gap-3">
          <Link
            href="/inscription"
            className="group flex flex-col gap-4 rounded-2xl bg-orange p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40">
                <ShoppingBag size={20} />
              </span>
              <ArrowRight size={18} className="mt-1.5 transition-transform group-hover:translate-x-1" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Devenir acheteur</h2>
              <p className="mt-1 text-xs text-white/85">Trouvez vos produits en toute simplicité</p>
            </div>
          </Link>

          <Link
            href="/admin/inscription"
            className="group flex flex-col gap-4 rounded-2xl p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40">
                <Store size={20} />
              </span>
              <ArrowRight size={18} className="mt-1.5 transition-transform group-hover:translate-x-1" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Devenir vendeur</h2>
              <p className="mt-1 text-xs text-white/85">Développez votre activité en Afrique</p>
            </div>
          </Link>
        </div>

        {/* Pricing: prices/features are always fetched live from subscription_plans, never hardcoded */}
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-navy">Nos offres vendeurs</h2>
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-orange" />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="flex flex-col rounded-2xl bg-blue-50 p-4 ring-1 ring-black/5">
              <span className="mb-2 w-fit rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                Mode Free
              </span>
              <p className="text-xl font-extrabold text-navy sm:text-2xl">
                {trialPlan ? formatFCFA(Number(trialPlan.price)) : "—"}
              </p>
              <p className="mb-3 text-xs text-gray-500">
                Essai de {trialPlan ? Math.round(trialPlan.duration_days / 30) : 3} mois
              </p>
              <ul className="mb-4 flex-1 space-y-1.5 text-xs text-gray-600">
                {(trialPlan?.features?.length
                  ? trialPlan.features
                  : ["Boutique en ligne", "Ajout de produits illimité", "Réception de commandes", "Support standard"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/inscription"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-navy px-3 py-2.5 text-xs font-bold text-white hover:bg-navy-light"
              >
                Commencer l&apos;essai
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex flex-col rounded-2xl bg-orange-light p-4 ring-2 ring-orange">
              <span className="mb-2 w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-dark">
                Mode Pro
              </span>
              <p className="text-xl font-extrabold text-navy sm:text-2xl">
                {proPlan ? `${formatFCFA(Number(proPlan.price))} / mois` : "—"}
              </p>
              <p className="mb-3 text-xs text-gray-500">Abonnement mensuel, sans engagement</p>
              <ul className="mb-4 flex-1 space-y-1.5 text-xs text-gray-600">
                {(proPlan?.features?.length
                  ? proPlan.features
                  : ["Tout l'essai", "Mise en avant dans le catalogue", "Statistiques avancées", "Support prioritaire"]
                ).map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/inscription"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-orange px-3 py-2.5 text-xs font-bold text-white hover:bg-orange-dark"
              >
                Passer au Pro
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-navy">Comment ça marche ?</h2>
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-orange" />

          <div className="mt-6 flex items-start justify-between">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start">
                <div className="flex w-20 flex-col items-center gap-2 text-center sm:w-24">
                  <div className="relative">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${step.tint}`}>
                      <step.icon size={22} />
                    </div>
                    <span
                      className={`absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${step.badge}`}
                    >
                      {step.number}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-navy">{step.title}</p>
                  <p className="text-[11px] leading-snug text-gray-500">{step.text}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={16} className="mt-6 shrink-0 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Informations importantes (résumé) */}
        <div className="mb-10 mt-10 flex gap-3 rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5 sm:p-5">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-500" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-bold text-navy">Informations importantes</p>
            <p className="mb-3 text-xs leading-relaxed text-gray-500">
              En utilisant AchaVite, vous acceptez nos conditions générales et notre politique de
              confidentialité.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/conditions"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gray-100"
              >
                <FileText size={13} />
                Conditions générales
                <ArrowRight size={12} />
              </Link>
              <Link
                href="/confidentialite"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gray-100"
              >
                <ShieldCheck size={13} />
                Confidentialité
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Legal disclaimer -- verbatim text provided by the platform owner */}
      {/* TODO: validation juridique avant mise en production */}
      <div className="bg-gray-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-8">
          <h2 className="mb-4 text-center text-base font-extrabold text-navy sm:text-lg">
            AVIS IMPORTANT — RÔLE DE LA PLATEFORME
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              « Cette plateforme est un service numérique de mise en relation entre acheteurs et
              vendeurs. Elle facilite la présentation des produits et services, la prospection de
              clients et la mise en relation des utilisateurs.
            </p>
            <p>
              La plateforme ne participe pas directement à la conclusion, à la négociation ou à
              l&apos;exécution des ventes conclues entre acheteurs et vendeurs et ne se substitue pas
              aux parties dans leur relation commerciale.
            </p>
            <p>
              Les vendeurs sont responsables des produits et services qu&apos;ils proposent, de
              l&apos;exactitude des informations publiées, de leurs prix, de leurs conditions de vente
              ainsi que du respect des obligations légales qui leur sont applicables.
            </p>
            <p>
              Les acheteurs sont responsables de leurs décisions d&apos;achat et des informations
              qu&apos;ils communiquent dans le cadre de leurs transactions.
            </p>
            <p>
              La plateforme met en œuvre des mesures destinées à protéger les données personnelles et
              les informations des utilisateurs conformément à sa politique de confidentialité et aux
              règles applicables.
            </p>
            <p>
              En utilisant la plateforme, chaque utilisateur reconnaît comprendre le rôle limité de la
              plateforme en tant qu&apos;intermédiaire numérique de mise en relation et accepte les
              conditions générales d&apos;utilisation. »
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
