"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";
import { CATEGORIES } from "@/lib/data";
import { formatFCFA } from "@/lib/format";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const products = useShopStore((s) => s.products);
  const addProduct = useShopStore((s) => s.addProduct);
  const updateProduct = useShopStore((s) => s.updateProduct);
  const deleteProduct = useShopStore((s) => s.deleteProduct);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  function handleSave(values: Parameters<Parameters<typeof ProductFormModal>[0]["onSave"]>[0]) {
    if (editing) {
      updateProduct(editing.id, values);
      toast.success("Produit modifié");
    } else {
      const id = `p-${Date.now()}`;
      addProduct({
        id,
        slug: `${values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(-4)}`,
        rating: 4.5,
        reviews: 0,
        sold: 0,
        createdAt: new Date().toISOString(),
        images: values.images ?? [],
        ...values,
      });
      toast.success("Produit ajouté");
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(p: Product) {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    deleteProduct(p.id);
    toast.success("Produit supprimé");
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

      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/5">
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
            {filtered.map((p) => {
              const category = CATEGORIES.find((c) => c.slug === p.category);
              return (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                      </div>
                      <span className="line-clamp-1 font-medium text-navy">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{category?.name ?? p.category}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{formatFCFA(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? "font-semibold text-orange" : "text-gray-600"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.active ? "Actif" : "Masqué"}
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
                      <button
                        onClick={() => handleDelete(p)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProductFormModal
          key={editing?.id ?? "new"}
          product={editing ?? undefined}
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
