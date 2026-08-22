"use client";

import { SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/lib/data";

export type SortKey = "pertinence" | "populaire" | "nouveaute" | "prix-asc" | "prix-desc";

export type Filters = {
  category: string;
  sort: SortKey;
  onlyPromo: boolean;
  onlyStock: boolean;
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "pertinence", label: "Pertinence" },
  { value: "populaire", label: "Meilleures ventes" },
  { value: "nouveaute", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
];

export function FilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <SlidersHorizontal size={16} />
        <span>{resultCount} produit{resultCount > 1 ? "s" : ""}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-orange"
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.filter((c) => c.slug !== "offres").map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-orange"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onChange({ ...filters, onlyPromo: !filters.onlyPromo })}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            filters.onlyPromo
              ? "border-orange bg-orange text-white"
              : "border-gray-200 bg-white text-navy"
          }`}
        >
          Promotions
        </button>
        <button
          onClick={() => onChange({ ...filters, onlyStock: !filters.onlyStock })}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            filters.onlyStock
              ? "border-orange bg-orange text-white"
              : "border-gray-200 bg-white text-navy"
          }`}
        >
          Disponible
        </button>
      </div>
    </div>
  );
}
