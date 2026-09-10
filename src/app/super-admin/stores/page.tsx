"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Store as StoreIcon } from "lucide-react";
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

const STATUS_LABEL: Record<StoreStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  suspended: "Suspendue",
};

export default function SuperAdminStoresPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<Store[]>([]);
  const [filter, setFilter] = useState<StoreStatus | "">("");
  const [loading, setLoading] = useState(true);

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
  }, [filter]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-navy">Boutiques</h1>
      <p className="mb-5 text-sm text-gray-500">
        Ouvrez le dossier d&apos;une boutique pour consulter les informations du vendeur et ses
        documents avant de la valider.
      </p>

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
            <Link
              key={store.id}
              href={`/super-admin/stores/${store.id}`}
              className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-black/5 transition-colors hover:bg-gray-50"
            >
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
                {STATUS_LABEL[store.status]}
              </span>
              <ChevronRight size={18} className="shrink-0 text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
