"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { StoreStatus } from "@/lib/db/types";

export function StoreReviewActions({
  storeId,
  storeName,
  status,
}: {
  storeId: string;
  storeName: string;
  status: StoreStatus;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function apply(patch: { status: StoreStatus; rejection_reason?: string | null }) {
    setBusy(true);
    const { error } = await supabase.from("stores").update(patch).eq("id", storeId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Boutique « ${storeName} » : statut mis à jour`);
    router.refresh();
  }

  async function handleReject() {
    const reason = window.prompt(`Motif du refus de « ${storeName} » (visible par le vendeur) :`, "");
    if (reason === null) return;
    await apply({ status: "rejected", rejection_reason: reason.trim() || null });
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-xl bg-white p-4 ring-1 ring-black/5">
      {status !== "approved" && (
        <button
          onClick={() => apply({ status: "approved", rejection_reason: null })}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Check size={15} /> Valider la boutique
        </button>
      )}
      {status === "pending" && (
        <button
          onClick={handleReject}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          <X size={15} /> Refuser
        </button>
      )}
      {status === "approved" && (
        <button
          onClick={() => apply({ status: "suspended" })}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          <Ban size={15} /> Suspendre
        </button>
      )}
      {status === "suspended" && (
        <button
          onClick={() => apply({ status: "approved" })}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
        >
          <RotateCcw size={15} /> Réactiver
        </button>
      )}
    </div>
  );
}
