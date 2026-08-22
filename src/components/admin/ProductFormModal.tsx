"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { slugify } from "@/lib/format";
import type { Product } from "@/lib/types";

type FormValues = {
  name: string;
  category: string;
  price: string;
  oldPrice: string;
  stock: string;
  description: string;
  highlights: string;
  isNew: boolean;
  isBestSeller: boolean;
  active: boolean;
};

const EMPTY: FormValues = {
  name: "",
  category: CATEGORIES[0].slug,
  price: "",
  oldPrice: "",
  stock: "0",
  description: "",
  highlights: "",
  isNew: false,
  isBestSeller: false,
  active: true,
};

export function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product?: Product;
  onClose: () => void;
  onSave: (values: Omit<Product, "id" | "slug" | "images" | "rating" | "reviews" | "sold" | "createdAt"> & { images?: string[] }) => void;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    product
      ? {
          name: product.name,
          category: product.category,
          price: String(product.price),
          oldPrice: product.oldPrice ? String(product.oldPrice) : "",
          stock: String(product.stock),
          description: product.description,
          highlights: product.highlights.join("\n"),
          isNew: product.isNew,
          isBestSeller: product.isBestSeller,
          active: product.active,
        }
      : EMPTY
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || !values.price) return;

    const price = Number(values.price);
    const oldPrice = values.oldPrice ? Number(values.oldPrice) : undefined;
    const slug = slugify(values.name);

    onSave({
      name: values.name.trim(),
      category: values.category,
      price,
      oldPrice,
      stock: Number(values.stock) || 0,
      description: values.description.trim(),
      highlights: values.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
      isNew: values.isNew,
      isBestSeller: values.isBestSeller,
      active: values.active,
      images: product?.images ?? [0, 1, 2].map((n) => `https://picsum.photos/seed/${slug}-${n}/900/900`),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-navy">
            {product ? "Modifier le produit" : "Ajouter un produit"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            required
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            placeholder="Nom du produit"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />

          <select
            value={values.category}
            onChange={(e) => setValues({ ...values, category: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            {CATEGORIES.filter((c) => c.slug !== "offres").map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <input
              required
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => setValues({ ...values, price: e.target.value })}
              placeholder="Prix (FCFA)"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
            <input
              type="number"
              min={0}
              value={values.oldPrice}
              onChange={(e) => setValues({ ...values, oldPrice: e.target.value })}
              placeholder="Ancien prix"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
            <input
              required
              type="number"
              min={0}
              value={values.stock}
              onChange={(e) => setValues({ ...values, stock: e.target.value })}
              placeholder="Stock"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>

          <textarea
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />

          <textarea
            value={values.highlights}
            onChange={(e) => setValues({ ...values, highlights: e.target.value })}
            placeholder="Points forts (un par ligne)"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={values.isNew}
                onChange={(e) => setValues({ ...values, isNew: e.target.checked })}
                className="h-4 w-4 accent-orange"
              />
              Nouveau
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={values.isBestSeller}
                onChange={(e) => setValues({ ...values, isBestSeller: e.target.checked })}
                className="h-4 w-4 accent-orange"
              />
              Meilleure vente
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={values.active}
                onChange={(e) => setValues({ ...values, active: e.target.checked })}
                className="h-4 w-4 accent-orange"
              />
              Actif (visible sur le site)
            </label>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-navy hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-orange py-2.5 text-sm font-bold text-white hover:bg-orange-dark"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
