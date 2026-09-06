import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ShoppingCart, Store, ChevronRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full"
        viewBox="0 0 500 150"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 90 C 140 20, 340 150, 500 60 L 500 150 L 0 150 Z" fill="var(--color-navy-light)" opacity="0.5" />
        <path d="M0 130 C 160 60, 360 170, 500 100 L 500 150 L 0 150 Z" fill="var(--color-orange)" opacity="0.85" />
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
            className="group flex items-center gap-4 rounded-2xl bg-orange-light p-4 shadow-xl transition-transform hover:-translate-y-0.5 sm:p-5"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange text-white">
              <ShoppingBag size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-navy sm:text-lg">Devenir acheteur</h2>
              <p className="mt-0.5 text-xs text-navy/60 sm:text-sm">
                Créez votre compte pour parcourir le catalogue et commander en toute simplicité.
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-orange shadow transition-transform group-hover:translate-x-1">
              <ChevronRight size={20} />
            </span>
          </Link>

          <Link
            href="/admin/inscription"
            className="group flex items-center gap-4 rounded-2xl bg-blue-50 p-4 shadow-xl transition-transform hover:-translate-y-0.5 sm:p-5"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white">
              <Store size={26} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-navy sm:text-lg">Devenir vendeur</h2>
              <p className="mt-0.5 text-xs text-navy/60 sm:text-sm">
                Créez votre boutique, ajoutez vos produits et vendez partout en Afrique.
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-500 shadow transition-transform group-hover:translate-x-1">
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
  );
}
