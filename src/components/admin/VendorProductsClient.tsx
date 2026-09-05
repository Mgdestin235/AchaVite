"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createProduct,
  deleteProduct as deleteProductRow,
  listVendorProducts,
  updateProduct,
  type ProductInput,
  type ProductWithRelations,
} from "@/lib/db/products";
import { formatFCFA } from "@/lib/format";
import { ProductFormModal } from "./ProductFormModal";

export function VendorProductsClient({
  storeId,
  categories,
}: {
  storeId: string;
  categories: { id: string; name: string }[];
}) {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProductWithRelations | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listVendorProducts(supabase, storeId).then((data) => {
      if (cancelled) return;
      setProducts(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, refreshKey]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "—");
  }, [categories]);

  async function handleSave(values: ProductInput) {
    if (editing) {
      const { error } = await updateProduct(supabase, editing.id, values);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Produit modifié");
    } else {
      const { error } = await createProduct(supabase, storeId, values);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Produit ajouté");
    }
    setShowForm(false);
    setEditing(null);
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(p: ProductWithRelations) {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    const { error } = await deleteProductRow(supabase, p.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Produit supprimé");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-navy">Produits ({products.length})</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-dark"
        >
          <Plus size={17} />
          Ajouter un produit
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : products.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Aucun produit pour le moment. Ajoutez votre premier produit.
        </p>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-2 md:hidden">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl bg-white p-3 ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {p.product_images[0] && (
                      <Image src={p.product_images[0].url} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-navy">{p.name}</p>
                    <p className="text-xs text-gray-400">{categoryName(p.category_id)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                      className="rounded-lg p-2 text-navy hover:bg-navy/5"
                    >
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-navy">{formatFCFA(p.price)}</span>
                  <span className={p.stock <= 5 ? "font-semibold text-orange" : "text-gray-600"}>
                    Stock : {p.stock}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.status === "active" ? "Actif" : "Masqué"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {p.product_images[0] && (
                            <Image src={p.product_images[0].url} alt={p.name} fill className="object-cover" />
                          )}
                        </div>
                        <span className="line-clamp-1 font-medium text-navy">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{categoryName(p.category_id)}</td>
                    <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock <= 5 ? "font-semibold text-orange" : "text-gray-600"}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.status === "active" ? "Actif" : "Masqué"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setShowForm(true);
                          }}
                          className="rounded-lg p-2 text-navy hover:bg-navy/5"
                        >
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <ProductFormModal
          key={editing?.id ?? "new"}
          product={editing ?? undefined}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
