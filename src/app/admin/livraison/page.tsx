"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";

export default function AdminDeliveryPage() {
  const zones = useShopStore((s) => s.zones);
  const updateZone = useShopStore((s) => s.updateZone);
  const addZone = useShopStore((s) => s.addZone);
  const deleteZone = useShopStore((s) => s.deleteZone);

  const [newCity, setNewCity] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newCity.trim()) return;
    if (zones.some((z) => z.city.toLowerCase() === newCity.toLowerCase())) {
      toast.error("Cette ville existe déjà.");
      return;
    }
    addZone({
      city: newCity.trim(),
      feeDomicile: 2000,
      feeRelais: 1000,
      hasRelais: false,
      hasBoutique: false,
      relaisPoints: [],
    });
    setNewCity("");
    toast.success("Ville ajoutée");
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Zones de livraison</h1>

      <form onSubmit={handleAdd} className="mb-5 flex gap-2">
        <input
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Nouvelle ville"
          className="flex-1 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button className="flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-dark">
          <Plus size={16} />
          Ajouter
        </button>
      </form>

      <div className="space-y-3">
        {zones.map((zone) => (
          <div key={zone.city} className="rounded-xl bg-white p-4 ring-1 ring-black/5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-navy">{zone.city}</h3>
              <button
                onClick={() => deleteZone(zone.city)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs text-gray-500">
                Frais domicile (FCFA)
                <input
                  type="number"
                  value={zone.feeDomicile}
                  onChange={(e) => updateZone(zone.city, { feeDomicile: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              <label className="text-xs text-gray-500">
                Frais point relais (FCFA)
                <input
                  type="number"
                  value={zone.feeRelais}
                  onChange={(e) => updateZone(zone.city, { feeRelais: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={zone.hasRelais}
                  onChange={(e) => updateZone(zone.city, { hasRelais: e.target.checked })}
                  className="h-4 w-4 accent-orange"
                />
                Point relais disponible
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={zone.hasBoutique}
                  onChange={(e) => updateZone(zone.city, { hasBoutique: e.target.checked })}
                  className="h-4 w-4 accent-orange"
                />
                Retrait en boutique
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
