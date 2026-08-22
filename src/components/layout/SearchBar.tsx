"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { CATEGORIES } from "@/lib/data";
import { formatFCFA } from "@/lib/format";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const products = useShopStore((s) => s.products);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 1) return { products: [], categories: [] };
    const matchedProducts = products
      .filter((p) => p.active && normalize(p.name).includes(q))
      .slice(0, 5);
    const matchedCategories = CATEGORIES.filter((c) => normalize(c.name).includes(q));
    return { products: matchedProducts, categories: matchedCategories };
  }, [query, products]);

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/catalogue?q=${encodeURIComponent(query.trim())}`);
  }

  const hasResults = results.products.length > 0 || results.categories.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={submitSearch} className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          type="text"
          placeholder="Rechercher un produit, une catégorie..."
          className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-9 text-sm text-navy outline-none ring-orange/30 transition focus:border-orange focus:bg-white focus:ring-2"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/5">
          {!hasResults && (
            <p className="px-3 py-4 text-center text-sm text-gray-500">
              Aucun résultat pour « {query} »
            </p>
          )}
          {results.categories.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-gray-400">
                Catégories
              </p>
              {results.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categorie/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-navy hover:bg-navy/5"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          {results.products.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-gray-400">
                Produits
              </p>
              {results.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/produit/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-navy/5"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-navy">{p.name}</p>
                    <p className="text-xs font-semibold text-orange">{formatFCFA(p.price)}</p>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => submitSearch()}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-navy hover:bg-navy/5"
              >
                Voir tous les résultats pour « {query} »
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
