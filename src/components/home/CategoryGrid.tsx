"use client";

import Link from "next/link";
import {
  Smartphone,
  Headphones,
  Shirt,
  Sparkles,
  Home,
  Watch,
  Wrench,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";

const ICONS: Record<string, LucideIcon> = {
  Smartphone,
  Headphones,
  Shirt,
  Sparkles,
  Home,
  Watch,
  Wrench,
  Percent,
};

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 className="mb-4 text-lg font-bold text-navy sm:text-xl">Catégories</h2>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8 md:gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] ?? Smartphone;
          const href = cat.slug === "offres" ? "/promotions" : `/categorie/${cat.slug}`;
          return (
            <Link
              key={cat.slug}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-colors hover:bg-navy/5"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-navy transition-colors group-hover:bg-orange group-hover:text-white sm:h-16 sm:w-16">
                <Icon size={26} strokeWidth={1.75} />
              </span>
              <span className="text-[11px] font-medium text-navy sm:text-xs">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
