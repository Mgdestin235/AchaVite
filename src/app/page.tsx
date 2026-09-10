import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ShoppingCart,
  Store,
  ArrowRight,
  ShieldCheck,
  User,
  FileText,
  Truck,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { number: 1, icon: ShoppingCart, tint: "bg-blue-50 text-blue-600", badge: "bg-blue-600", title: "Acheter", text: "Trouvez et commandez vos produits" },
  { number: 2, icon: Store, tint: "bg-orange-light text-orange-dark", badge: "bg-orange", title: "Vendre", text: "Créez votre boutique et vendez en Afrique" },
  { number: 3, icon: Truck, tint: "bg-blue-50 text-blue-600", badge: "bg-blue-600", title: "Suivre", text: "Suivez vos commandes en temps réel" },
] as const;

export default function LandingPage() {
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
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-sm text-white/80">👋 Bonjour,</p>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Bienvenue sur Acha<span className="text-orange">Vite</span>
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-blue-300">La marketplace 100% africaine</p>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">Achetez, vendez et développez votre activité.</p>
          </div>

          {/* Decorative illustration -- hidden on very narrow phones so the
              text never has to compete with it for space. */}
          <div className="relative hidden h-28 w-28 shrink-0 sm:flex sm:h-32 sm:w-32 sm:items-center sm:justify-center">
            <div className="absolute h-24 w-24 rounded-full bg-orange/25 blur-xl sm:h-28 sm:w-28" />
            <div className="relative flex h-20 w-14 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 shadow-lg backdrop-blur-sm sm:h-24 sm:w-16">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white shadow sm:h-8 sm:w-8">
                <Store size={14} />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-navy shadow sm:h-8 sm:w-8">
                <ShoppingCart size={14} />
              </span>
            </div>
            <Sparkles size={16} className="absolute -right-1 top-3 text-orange" />
            <Sparkles size={11} className="absolute -left-1 bottom-5 text-white/70" />
          </div>
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
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange shadow transition-transform group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Devenir acheteur</h2>
              <p className="mt-1 text-xs text-white/85">Trouvez vos produits en toute simplicité</p>
            </div>
          </Link>

          <Link
            href="/vendeur/offres"
            className="group flex flex-col gap-4 rounded-2xl p-4 text-white shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40">
                <Store size={20} />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow transition-transform group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Devenir vendeur</h2>
              <p className="mt-1 text-xs text-white/85">Développez votre activité en Afrique</p>
            </div>
          </Link>
        </div>

        {/* Comment ça marche */}
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-navy">Comment ça marche ?</h2>
              <span className="mt-1.5 block h-1 w-10 rounded-full bg-orange" />
            </div>
            <span className="text-xs text-gray-400">Simple • Rapide • Efficace</span>
          </div>

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
              AchaVite est une plateforme de mise en relation entre acheteurs et vendeurs. Chaque
              vendeur reste responsable de ses produits, prix et conditions de vente.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/avis-important"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-gray-100"
              >
                <FileText size={13} />
                Avis important — Rôle de la plateforme
                <ArrowRight size={12} />
              </Link>
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
                Politique de confidentialité
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
