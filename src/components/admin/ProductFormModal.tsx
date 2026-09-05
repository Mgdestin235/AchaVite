"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ImageUploadGrid } from "./ImageUploadGrid";
import { VideoUploadField } from "./VideoUploadField";
import { DocumentUploadList } from "./DocumentUploadList";
import type { ProductInput } from "@/lib/db/products";
import type { ProductWithRelations } from "@/lib/db/products";
import type { ProductFile } from "@/lib/types";

type FormValues = {
  name: string;
  categoryId: string;
  price: string;
  oldPrice: string;
  stock: string;
  description: string;
  highlights: string;
  isNew: boolean;
  isBestSeller: boolean;
  status: "active" | "inactive";
  images: string[];
  videoUrl?: string;
  files: ProductFile[];
};

function emptyValues(defaultCategoryId: string): FormValues {
  return {
    name: "",
    categoryId: defaultCategoryId,
    price: "",
    oldPrice: "",
    stock: "0",
    description: "",
    highlights: "",
    isNew: false,
    isBestSeller: false,
    status: "active",
    images: [],
    videoUrl: undefined,
    files: [],
  };
}

export function ProductFormModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product?: ProductWithRelations;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSave: (values: ProductInput) => void;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    product
      ? {
          name: product.name,
          categoryId: product.category_id ?? categories[0]?.id ?? "",
          price: String(product.price),
          oldPrice: product.old_price ? String(product.old_price) : "",
          stock: String(product.stock),
          description: product.description ?? "",
          highlights: product.highlights.join("\n"),
          isNew: product.is_new,
          isBestSeller: product.is_best_seller,
          status: product.status === "pending" ? "inactive" : product.status,
          images: product.product_images
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((img) => img.url),
          videoUrl: product.video_url ?? undefined,
          files: product.product_files.map((f) => ({ id: f.id, name: f.name, url: f.url, kind: f.kind })),
        }
      : emptyValues(categories[0]?.id ?? "")
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim() || !values.price) return;
    if (values.images.length === 0) return;

    onSave({
      name: values.name.trim(),
      categoryId: values.categoryId || null,
      price: Number(values.price),
      oldPrice: values.oldPrice ? Number(values.oldPrice) : null,
      stock: Number(values.stock) || 0,
      description: values.description.trim(),
      highlights: values.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
      isNew: values.isNew,
      isBestSeller: values.isBestSeller,
      status: values.status,
      videoUrl: values.videoUrl,
      images: values.images,
      files: values.files.map((f) => ({ name: f.name, url: f.url, kind: f.kind })),
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

        <div className="space-y-4">
          <ImageUploadGrid
            images={values.images}
            onChange={(images) => setValues({ ...values, images })}
          />
          {values.images.length === 0 && (
            <p className="-mt-2 text-xs text-red-500">Ajoutez au moins une photo.</p>
          )}

          <input
            required
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            placeholder="Nom du produit"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />

          <select
            value={values.categoryId}
            onChange={(e) => setValues({ ...values, categoryId: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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

          <div className="flex flex-wrap gap-4">
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
                checked={values.status === "active"}
                onChange={(e) => setValues({ ...values, status: e.target.checked ? "active" : "inactive" })}
                className="h-4 w-4 accent-orange"
              />
              Actif (visible sur le site)
            </label>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase text-gray-400">Médias complémentaires</p>
            <VideoUploadField
              videoUrl={values.videoUrl}
              onChange={(videoUrl) => setValues({ ...values, videoUrl })}
            />
            <DocumentUploadList
              kind="pdf"
              files={values.files}
              onChange={(files) => setValues({ ...values, files })}
            />
            <DocumentUploadList
              kind="ebook"
              files={values.files}
              onChange={(files) => setValues({ ...values, files })}
            />
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
