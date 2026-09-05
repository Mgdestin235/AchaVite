"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ProductStatus } from "@/lib/db/types";

type ProductRowWithStore = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  stores: { name: string } | null;
};

export default function SuperAdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductRowWithStore[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("products")
      .select("id, name, price, stock, status, stores(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setProducts((data as unknown as ProductRowWithStore[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function toggleStatus(product: ProductRowWithStore) {
    const status: ProductStatus = product.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("products").update({ status }).eq("id", product.id);
    if (!error) setRefreshKey((k) => k + 1);
  }

  const filtered = products.filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Produits ({products.length})</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit..."
        className="mb-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Boutique</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.stores?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-navy">{formatFCFA(p.price)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.stock}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(p)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {p.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
