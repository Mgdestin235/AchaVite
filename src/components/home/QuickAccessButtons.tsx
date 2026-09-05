import Link from "next/link";
import { ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";

export function QuickAccessButtons() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/catalogue"
          className="group flex items-center gap-4 rounded-2xl bg-orange p-5 text-white shadow-lg shadow-orange/20 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <ShoppingBag size={24} />
          </span>
          <div className="flex-1">
            <p className="text-base font-bold">Voir les produits</p>
            <p className="text-sm text-white/80">Parcourez, commandez et achetez en quelques clics</p>
          </div>
          <ArrowRight size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin"
          className="group flex items-center gap-4 rounded-2xl bg-navy p-5 text-white shadow-lg shadow-navy/20 transition-transform hover:scale-[1.02] active:scale-95"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <ShieldCheck size={24} />
          </span>
          <div className="flex-1">
            <p className="text-base font-bold">Espace Admin</p>
            <p className="text-sm text-white/70">Gérez produits, commandes et paramètres de la boutique</p>
          </div>
          <ArrowRight size={20} className="shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
