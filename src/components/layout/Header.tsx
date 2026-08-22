"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingCart, User, Package, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { CATEGORIES } from "@/lib/data";
import { SearchBar } from "./SearchBar";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));
  const currentPhone = useAuthStore((s) => s.currentPhone);

  return (
    <header className="sticky top-0 z-40 bg-navy shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-1.5 text-white hover:bg-white/10 lg:hidden"
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg font-extrabold text-orange ring-1 ring-orange/40">
            A
          </span>
          <span className="hidden text-lg font-extrabold text-white sm:block">
            Acha<span className="text-orange">Vite</span>
          </span>
        </Link>

        <div className="hidden flex-1 lg:block">
          <SearchBar />
        </div>

        <nav className="hidden items-center gap-5 lg:flex">
          <Link href="/catalogue" className="text-sm font-medium text-white/90 hover:text-orange">
            Catalogue
          </Link>
          <Link href="/promotions" className="text-sm font-medium text-white/90 hover:text-orange">
            Promotions
          </Link>
          <Link href="/suivi" className="text-sm font-medium text-white/90 hover:text-orange">
            Suivi commande
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
          <Link
            href={currentPhone ? "/compte" : "/connexion"}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white/90 hover:bg-white/10 lg:flex"
          >
            <User size={19} />
            {currentPhone ? "Mon compte" : "Se connecter"}
          </Link>
          <Link
            href="/compte/commandes"
            className="hidden rounded-lg p-2 text-white/90 hover:bg-white/10 lg:flex"
            aria-label="Mes commandes"
          >
            <Package size={21} />
          </Link>
          <Link
            href="/panier"
            className="relative rounded-lg p-2 text-white hover:bg-white/10"
            aria-label="Panier"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 lg:hidden">
        <SearchBar />
      </div>

      <div className="hidden border-t border-white/10 bg-navy-light/40 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-6 py-2 text-sm">
          {CATEGORIES.slice(0, 7).map((c) => (
            <Link
              key={c.slug}
              href={`/categorie/${c.slug}`}
              className="shrink-0 whitespace-nowrap text-white/80 hover:text-orange"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-extrabold text-navy">
                Acha<span className="text-orange">Vite</span>
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-navy hover:bg-navy/5"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5">
                Accueil
              </Link>
              <Link href="/catalogue" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5">
                Catalogue
              </Link>
              <Link href="/promotions" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5">
                Promotions
              </Link>
              <Link href="/suivi" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5">
                Suivi de commande
              </Link>
              <Link href={currentPhone ? "/compte" : "/connexion"} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5">
                {currentPhone ? "Mon compte" : "Se connecter"}
              </Link>
              <p className="mt-3 px-3 text-xs font-semibold uppercase text-gray-400">
                Catégories
              </p>
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={c.slug === "offres" ? "/promotions" : `/categorie/${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-navy hover:bg-navy/5"
                >
                  {c.name}
                </Link>
              ))}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <Link href="/contact" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-navy/5">
                  Contact & Aide
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
