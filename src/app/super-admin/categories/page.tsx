"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/db/types";

export default function SuperAdminCategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (cancelled) return;
        setCategories((data as Category[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name) });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Catégorie ajoutée");
    setName("");
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Supprimer « ${category.name} » ?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Catégorie supprimée");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Catégories</h1>

      <form onSubmit={handleCreate} className="mb-5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="max-w-xs flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button className="flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-dark">
          <Plus size={16} />
          Ajouter
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-black/5">
              <span className="text-sm font-medium text-navy">{category.name}</span>
              <button onClick={() => handleDelete(category)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
