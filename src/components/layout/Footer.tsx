import Image from "next/image";
import Link from "next/link";
import { Globe, MessageCircle, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-10 bg-navy-dark pb-24 pt-10 text-white/70 lg:pb-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="inline-flex rounded-lg bg-white px-2 py-1.5">
            <Image src="/brand/logo-full.png" alt="AchaVite" width={140} height={107} className="h-9 w-auto" />
          </span>
          <p className="mt-3 text-sm">
            La boutique en ligne 100% africaine. Les meilleures bonnes affaires à
            portée de main.
          </p>
          <div className="mt-4 flex gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Globe size={16} />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Send size={16} />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <MessageCircle size={16} />
            </span>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-orange">Accueil</Link></li>
            <li><Link href="/catalogue" className="hover:text-orange">Produits</Link></li>
            <li><Link href="/catalogue" className="hover:text-orange">Catégories</Link></li>
            <li><Link href="/promotions" className="hover:text-orange">Promotions</Link></li>
            <li><Link href="/compte/commandes" className="hover:text-orange">Mes commandes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Assistance</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/contact" className="hover:text-orange">Contact</Link></li>
            <li><Link href="/faq" className="hover:text-orange">FAQ</Link></li>
            <li><Link href="/faq#livraison" className="hover:text-orange">Livraison</Link></li>
            <li><Link href="/faq#paiement" className="hover:text-orange">Paiement</Link></li>
            <li><Link href="/faq#retours" className="hover:text-orange">Retours</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Informations</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/conditions" className="hover:text-orange">Conditions générales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-orange">Politique de confidentialité</Link></li>
            <li><Link href="/faq#livraison" className="hover:text-orange">Politique de livraison</Link></li>
            <li><Link href="/faq#retours" className="hover:text-orange">Politique de retour</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 px-4 pt-6 text-xs sm:px-6">
        © {new Date().getFullYear()} AchaVite. Tous droits réservés.
      </div>
    </footer>
  );
}
