import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Store, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center bg-navy px-4 py-12 sm:px-6">
      <Image
        src="/brand/logo-full.png"
        alt="AchaVite"
        width={200}
        height={153}
        priority
        className="mb-6 h-14 w-auto rounded-xl bg-white px-3 py-2 sm:h-16"
      />
      <h1 className="mb-2 text-center text-2xl font-extrabold text-white sm:text-3xl">
        Bienvenue sur AchaVite
      </h1>
      <p className="mb-10 max-w-md text-center text-sm text-white/70 sm:text-base">
        La marketplace 100% africaine. Achetez auprès de centaines de vendeurs, ou lancez votre
        propre boutique en quelques minutes.
      </p>

      <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        <Link
          href="/inscription"
          className="group flex flex-col items-start gap-4 rounded-2xl bg-white p-6 shadow-xl transition-transform hover:-translate-y-1 sm:p-8"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-light text-orange">
            <ShoppingBag size={28} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-navy sm:text-xl">Devenir acheteur</h2>
            <p className="mt-1 text-sm text-gray-500">
              Créez votre compte pour parcourir le catalogue et commander en toute simplicité.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-bold text-orange">
            Créer mon compte
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/admin/inscription"
          className="group flex flex-col items-start gap-4 rounded-2xl bg-white p-6 shadow-xl transition-transform hover:-translate-y-1 sm:p-8"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/10 text-navy">
            <Store size={28} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-navy sm:text-xl">Devenir vendeur</h2>
            <p className="mt-1 text-sm text-gray-500">
              Créez votre boutique, ajoutez vos produits et vendez partout en Afrique.
            </p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-bold text-navy">
            Créer ma boutique
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <p className="mt-10 max-w-md text-center text-xs text-white/50">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-white underline">
          Connectez-vous
        </Link>{" "}
        · Vous pouvez aussi{" "}
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
  );
}
