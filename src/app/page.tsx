import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ShoppingCart, Store, ChevronRight, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import { formatFCFA } from "@/lib/format";

export default async function LandingPage() {
  const supabase = await createClient();
  const [trialPlan, proPlan] = await Promise.all([
    getActivePlan(supabase, "trial"),
    getActivePlan(supabase, "pro_monthly"),
  ]);

  return (
    <>
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center overflow-hidden bg-navy px-4 py-12 sm:px-6">
      {/* Decorative background waves */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-64 w-full text-navy-light/40"
        viewBox="0 0 500 200"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 60 C 120 120, 260 0, 500 70 L 500 0 L 0 0 Z" fill="currentColor" />
      </svg>
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 w-full"
        viewBox="0 0 500 180"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 110 C 150 60, 320 140, 500 90 L 500 180 L 0 180 Z" fill="#1c3f68" opacity="0.7" />
        <path d="M0 150 C 180 100, 300 170, 500 120 L 500 180 L 0 180 Z" fill="var(--color-navy-light)" />
        <path d="M230 180 C 300 130, 420 110, 500 140 L 500 180 Z" fill="var(--color-orange)" />
      </svg>

      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="relative mb-6">
          <Image
            src="/brand/logo-full.png"
            alt="AchaVite"
            width={200}
            height={153}
            priority
            className="h-14 w-auto rounded-2xl bg-white px-3 py-2 shadow-lg sm:h-16"
          />
          <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange text-white shadow-md ring-4 ring-navy">
            <ShoppingCart size={15} />
          </span>
        </div>

        <h1 className="relative mb-2 text-center text-2xl font-extrabold text-white sm:text-3xl">
          Bienvenue sur Acha<span className="text-orange">Vite</span>
          <svg
            className="absolute -bottom-2 left-1/2 h-2 w-24 -translate-x-1/2 text-orange sm:w-28"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
          >
            <path d="M2 6 Q 25 -2, 50 5 T 98 5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </h1>
        <p className="mb-10 mt-4 max-w-md text-center text-sm text-white/70 sm:text-base">
          La marketplace 100% africaine. Achetez auprès de centaines de vendeurs, ou lancez votre
          propre boutique en quelques minutes.
        </p>

        <div className="flex w-full max-w-md flex-col gap-4">
          <Link
            href="/inscription"
            className="group relative flex items-start gap-4 rounded-2xl bg-orange-light p-4 shadow-xl transition-transform hover:-translate-y-0.5 sm:p-5"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner"
              style={{ background: "linear-gradient(145deg, #ffb066, var(--color-orange))" }}
            >
              <ShoppingBag size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-navy sm:text-lg">Devenir acheteur</h2>
              <p className="mt-0.5 text-xs text-navy/60 sm:text-sm">
                Créez votre compte pour parcourir le catalogue et commander en toute simplicité.
              </p>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-bold text-orange">
                Créer mon compte
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <span className="absolute right-4 top-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-orange shadow transition-transform group-hover:translate-x-1">
              <ChevronRight size={20} />
            </span>
          </Link>

          <Link
            href="/admin/inscription"
            className="group relative flex items-start gap-4 rounded-2xl bg-blue-50 p-4 shadow-xl transition-transform hover:-translate-y-0.5 sm:p-5"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner"
              style={{ background: "linear-gradient(145deg, #60a5fa, #2563eb)" }}
            >
              <Store size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-navy sm:text-lg">Devenir vendeur</h2>
              <p className="mt-0.5 text-xs text-navy/60 sm:text-sm">
                Créez votre boutique, ajoutez vos produits et vendez partout en Afrique.
              </p>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-bold text-blue-600">
                Créer ma boutique
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <span className="absolute right-4 top-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-500 shadow transition-transform group-hover:translate-x-1">
              <ChevronRight size={20} />
            </span>
          </Link>
        </div>

        <div className="mt-10 flex max-w-sm items-start gap-3 text-left">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-white/40" />
          <p className="text-xs leading-relaxed text-white/50">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="font-semibold text-white underline">
              Connectez-vous
            </Link>
            .
            <br />
            Vous pouvez aussi{" "}
            <Link href="/boutique" className="font-semibold text-white underline">
              parcourir la boutique
            </Link>{" "}
            sans compte, ou{" "}
            <Link href="/suivi" className="font-semibold text-white underline">
              suivre une commande
            </Link>
            .
          </p>
        </div>
      </div>
    </div>

    {/* Pricing cards: prices are always fetched live from subscription_plans, never hardcoded */}
    <div className="bg-gray-50 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-xl font-extrabold text-navy sm:text-2xl">
          Deux façons de vendre sur Acha<span className="text-orange">Vite</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-navy/50">Mode Free</p>
            <p className="mb-1 text-3xl font-extrabold text-navy">
              {trialPlan ? formatFCFA(Number(trialPlan.price)) : "—"}
            </p>
            <p className="mb-5 text-sm text-gray-500">
              Essai de {trialPlan ? Math.round(trialPlan.duration_days / 30) : 3} mois
            </p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-gray-600">
              {(trialPlan?.features?.length ? trialPlan.features : [
                "Boutique en ligne complète",
                "Produits illimités",
                "Support par WhatsApp",
              ]).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/admin/inscription"
              className="rounded-xl bg-navy px-4 py-3 text-center text-sm font-bold text-white hover:bg-navy-light"
            >
              Commencer l&apos;essai
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-md ring-2 ring-orange">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-orange">Mode Pro</p>
            <p className="mb-1 text-3xl font-extrabold text-navy">
              {proPlan ? `${formatFCFA(Number(proPlan.price))} / mois` : "—"}
            </p>
            <p className="mb-5 text-sm text-gray-500">Abonnement mensuel, sans engagement</p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-gray-600">
              {(proPlan?.features?.length ? proPlan.features : [
                "Tout le mode Free, en illimité",
                "Mise en avant dans le catalogue",
                "Support prioritaire",
              ]).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/admin/inscription"
              className="rounded-xl bg-orange px-4 py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
            >
              Passer au Pro
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* Legal disclaimer -- verbatim text provided by the platform owner */}
    {/* TODO: validation juridique avant mise en production */}
    <div className="bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-gray-50 p-6 ring-1 ring-black/5 sm:p-8">
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
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/conditions"
            className="rounded-xl bg-navy px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-navy-light"
          >
            Lire les conditions générales
          </Link>
          <Link
            href="/confidentialite"
            className="rounded-xl border border-navy/20 px-4 py-2.5 text-center text-sm font-bold text-navy hover:bg-navy/5"
          >
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
