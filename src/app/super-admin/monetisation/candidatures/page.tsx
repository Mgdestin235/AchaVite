"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  confirmVendorApplication,
  listVendorApplications,
  rejectVendorApplication,
} from "@/lib/db/vendorApplications";
import { formatFCFA } from "@/lib/format";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";
import type { VendorApplication, VendorApplicationStatus } from "@/lib/db/types";

const STATUS_META: Record<VendorApplicationStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmé — code émis", color: "bg-blue-100 text-blue-700" },
  consumed: { label: "Compte créé", color: "bg-green-100 text-green-700" },
  rejected: { label: "Refusé", color: "bg-red-100 text-red-600" },
};

const PLAN_LABEL: Record<string, string> = {
  trial: "Mode Free (essai)",
  pro_monthly: "Mode Pro",
};

export default function CandidaturesPage() {
  const supabase = createClient();
  const [apps, setApps] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listVendorApplications(supabase).then((data) => {
      if (cancelled) return;
      setApps(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleConfirm(app: VendorApplication) {
    if (!confirm(`Confirmer le paiement de ${formatFCFA(Number(app.amount))} pour ${app.email} ?`)) return;
    const { code, error } = await confirmVendorApplication(supabase, app.id);
    if (error || !code) {
      toast.error(error ?? "Échec");
      return;
    }
    toast.success(`Code généré : ${code}`);
    setRefreshKey((k) => k + 1);
  }

  async function handleReject(app: VendorApplication) {
    if (!confirm(`Refuser la candidature de ${app.email} ?`)) return;
    const { error } = await rejectVendorApplication(supabase, app.id);
    if (error) {
      toast.error(error);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).then(
      () => toast.success("Code copié"),
      () => toast.error("Impossible de copier")
    );
  }

  function whatsappLink(app: VendorApplication): string | null {
    if (!app.phone || !app.access_code) return null;
    const num = normalizePhoneForWhatsApp(app.phone);
    const msg = `Bonjour, votre paiement AchaVite est confirmé. Voici votre code d'accès à usage unique pour créer votre compte vendeur : ${app.access_code}\nRendez-vous sur ${typeof window !== "undefined" ? window.location.origin : ""}/vendeur/creation-compte`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        Chaque ligne est un visiteur qui a déclaré avoir payé la formule Free ou Pro. Après
        vérification du versement, confirmez : un code d&apos;accès à usage unique est généré, à
        transmettre au candidat (WhatsApp). Ce code débloque le formulaire de création de compte.
      </p>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>
      ) : apps.length === 0 ? (
        <p className="rounded-xl bg-white py-10 text-center text-sm text-gray-400 ring-1 ring-black/5">
          Aucune candidature.
        </p>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <div key={app.id} className="rounded-xl bg-white p-4 ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{app.email}</p>
                  <p className="text-xs text-gray-500">
                    {app.phone || "—"} · {PLAN_LABEL[app.plan_code] ?? app.plan_code} ·{" "}
                    {formatFCFA(Number(app.amount))}
                    {app.reference ? ` · réf. ${app.reference}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {new Date(app.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_META[app.status].color}`}>
                  {STATUS_META[app.status].label}
                </span>
              </div>

              {app.status === "confirmed" && app.access_code && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-navy/5 p-2.5">
                  <span className="font-mono text-sm font-bold tracking-widest text-navy">{app.access_code}</span>
                  <button
                    onClick={() => copyCode(app.access_code!)}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-navy hover:bg-gray-50"
                  >
                    <Copy size={12} /> Copier
                  </button>
                  {whatsappLink(app) && (
                    <a
                      href={whatsappLink(app)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      <MessageCircle size={12} /> Envoyer sur WhatsApp
                    </a>
                  )}
                </div>
              )}

              {app.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleConfirm(app)}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                  >
                    <Check size={14} /> Confirmer le paiement
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    <X size={14} /> Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
