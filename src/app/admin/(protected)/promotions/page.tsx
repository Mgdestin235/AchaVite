"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";
import type { Promo } from "@/lib/types";

const EMPTY: Omit<Promo, "used"> = {
  code: "",
  type: "percent",
  value: 10,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  maxUses: 100,
  active: true,
};

export default function AdminPromotionsPage() {
  const promos = useShopStore((s) => s.promos);
  const addPromo = useShopStore((s) => s.addPromo);
  const updatePromo = useShopStore((s) => s.updatePromo);
  const deletePromo = useShopStore((s) => s.deletePromo);

  const [form, setForm] = useState(EMPTY);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) return;
    if (promos.some((p) => p.code.toLowerCase() === form.code.toLowerCase())) {
      toast.error("Ce code promo existe déjà.");
      return;
    }
    addPromo({ ...form, code: form.code.toUpperCase().trim(), used: 0 });
    toast.success("Code promo créé");
    setForm(EMPTY);
  }

  function handleDelete(code: string) {
    if (!confirm(`Supprimer le code ${code} ?`)) return;
    deletePromo(code);
    toast.success("Code promo supprimé");
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Promotions</h1>

      <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5 sm:grid-cols-6">
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Code (ex: PROMO10)"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange sm:col-span-2"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as Promo["type"] })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="percent">Pourcentage</option>
          <option value="fixed">Montant fixe</option>
        </select>
        <input
          type="number"
          min={0}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
          placeholder="Valeur"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <input
          type="number"
          min={1}
          value={form.maxUses}
          onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
          placeholder="Utilisations max"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button className="flex items-center justify-center gap-2 rounded-lg bg-orange px-3 py-2.5 text-sm font-bold text-white hover:bg-orange-dark sm:col-span-2">
          <Plus size={16} />
          Créer le code
        </button>
      </form>

      {/* Mobile: card list */}
      <div className="space-y-2 md:hidden">
        {promos.map((p) => (
          <div key={p.code} className="rounded-xl bg-white p-3 ring-1 ring-black/5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-navy">{p.code}</span>
              <button
                onClick={() => handleDelete(p.code)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-500">
              <span>Réduction</span>
              <span className="text-right font-medium text-navy">
                {p.type === "percent" ? `${p.value}%` : `${p.value} FCFA`}
              </span>
              <span>Période</span>
              <span className="text-right">{p.startDate} → {p.endDate}</span>
              <span>Utilisation</span>
              <span className="text-right">{p.used} / {p.maxUses}</span>
            </div>
            <button
              onClick={() => updatePromo(p.code, { active: !p.active })}
              className={`mt-3 w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {p.active ? "Actif" : "Inactif"}
            </button>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl bg-white ring-1 ring-black/5 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Réduction</th>
              <th className="px-4 py-3">Période</th>
              <th className="px-4 py-3">Utilisation</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.code} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-bold text-navy">{p.code}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.type === "percent" ? `${p.value}%` : `${p.value} FCFA`}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.startDate} → {p.endDate}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.used} / {p.maxUses}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updatePromo(p.code, { active: !p.active })}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(p.code)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
