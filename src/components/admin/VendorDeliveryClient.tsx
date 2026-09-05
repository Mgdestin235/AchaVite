"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createZone, deleteZone as deleteZoneRow, listVendorZones, updateZone } from "@/lib/db/deliveryZones";
import type { DeliveryZoneRow } from "@/lib/db/types";

export function VendorDeliveryClient({ storeId }: { storeId: string }) {
  const supabase = createClient();
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newCity, setNewCity] = useState("");

  useEffect(() => {
    let cancelled = false;
    listVendorZones(supabase, storeId).then((data) => {
      if (cancelled) return;
      setZones(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, refreshKey]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newCity.trim()) return;
    if (zones.some((z) => z.city.toLowerCase() === newCity.trim().toLowerCase())) {
      toast.error("Cette ville existe déjà.");
      return;
    }
    const { error } = await createZone(supabase, storeId, newCity.trim());
    if (error) {
      toast.error(error);
      return;
    }
    setNewCity("");
    toast.success("Ville ajoutée");
    setRefreshKey((k) => k + 1);
  }

  async function handleUpdate(zone: DeliveryZoneRow, patch: Partial<DeliveryZoneRow>) {
    setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, ...patch } : z)));
    const { error } = await updateZone(supabase, zone.id, patch);
    if (error) {
      toast.error(error);
      setRefreshKey((k) => k + 1);
    }
  }

  async function handleDelete(zone: DeliveryZoneRow) {
    const { error } = await deleteZoneRow(supabase, zone.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Ville supprimée");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Zones de livraison</h1>

      <form onSubmit={handleAdd} className="mb-5 flex gap-2">
        <input
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Nouvelle ville"
          className="max-w-xs flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button className="flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-dark">
          <Plus size={16} />
          Ajouter
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : zones.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Aucune zone de livraison configurée.
        </p>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-xl bg-white p-4 ring-1 ring-black/5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-navy">{zone.city}</h3>
                <button onClick={() => handleDelete(zone)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs text-gray-500">
                  Frais domicile (FCFA)
                  <input
                    type="number"
                    value={zone.fee_domicile}
                    onChange={(e) => handleUpdate(zone, { fee_domicile: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Frais point relais (FCFA)
                  <input
                    type="number"
                    value={zone.fee_relais}
                    onChange={(e) => handleUpdate(zone, { fee_relais: Number(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                  />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={zone.has_relais}
                    onChange={(e) => handleUpdate(zone, { has_relais: e.target.checked })}
                    className="h-4 w-4 accent-orange"
                  />
                  Point relais disponible
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={zone.has_boutique}
                    onChange={(e) => handleUpdate(zone, { has_boutique: e.target.checked })}
                    className="h-4 w-4 accent-orange"
                  />
                  Retrait en boutique
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
