"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, X, Ban, RotateCcw, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Store, StoreStatus } from "@/lib/db/types";
import { cn } from "@/lib/cn";

const STATUS_FILTERS: { value: StoreStatus | ""; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvées" },
  { value: "rejected", label: "Refusées" },
  { value: "suspended", label: "Suspendues" },
];

const STATUS_BADGE: Record<StoreStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  suspended: "bg-gray-100 text-gray-500",
};

export default function SuperAdminStoresPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<Store[]>([]);
  const [filter, setFilter] = useState<StoreStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let query = supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (filter) query = query.eq("status", filter);
    query.then(({ data }) => {
      if (cancelled) return;
      setStores((data as Store[]) ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  async function setStatus(store: Store, status: StoreStatus) {
    const { error } = await supabase.from("stores").update({ status }).eq("id", store.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Boutique « ${store.name} » : statut mis à jour`);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Boutiques</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              filter === f.value ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-black/5"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : stores.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Aucune boutique.</p>
      ) : (
        <div className="space-y-2">
          {stores.map((store) => (
            <div key={store.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5 sm:flex-row sm:items-center">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {store.logo_url ? (
                  <Image src={store.logo_url} alt={store.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <StoreIcon size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{store.name}</p>
                <p className="truncate text-xs text-gray-400">{store.city || "Ville non renseignée"}</p>
              </div>
              <span className={cn("w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_BADGE[store.status])}>
                {store.status}
              </span>
              <div className="flex shrink-0 gap-2">
                {store.status !== "approved" && (
                  <button
                    onClick={() => setStatus(store, "approved")}
                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                  >
                    <Check size={14} /> Approuver
                  </button>
                )}
                {store.status !== "rejected" && store.status === "pending" && (
                  <button
                    onClick={() => setStatus(store, "rejected")}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    <X size={14} /> Refuser
                  </button>
                )}
                {store.status === "approved" && (
                  <button
                    onClick={() => setStatus(store, "suspended")}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                  >
                    <Ban size={14} /> Suspendre
                  </button>
                )}
                {store.status === "suspended" && (
                  <button
                    onClick={() => setStatus(store, "approved")}
                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                  >
                    <RotateCcw size={14} /> Réactiver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
