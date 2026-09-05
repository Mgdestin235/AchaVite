"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Smartphone, Landmark } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";
import type { PlatformSettings } from "@/lib/db/types";

const MOBILE_METHODS: { key: "mtn" | "airtel" | "moov"; label: string; color: string }[] = [
  { key: "mtn", label: "MTN Mobile Money", color: "bg-yellow-400 text-navy" },
  { key: "airtel", label: "Airtel Money", color: "bg-red-500 text-white" },
  { key: "moov", label: "Moov Money", color: "bg-blue-500 text-white" },
];

const EMPTY: PlatformSettings = {
  id: 1,
  commission_percent: 10,
  whatsapp_number: "",
  mtn_enabled: false,
  mtn_number: "",
  airtel_enabled: false,
  airtel_number: "",
  moov_enabled: false,
  moov_number: "",
  bank_enabled: false,
  bank_name: "",
  bank_account_number: "",
  bank_account_holder: "",
};

export default function SuperAdminPaymentsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<PlatformSettings>(EMPTY);
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingMethods, setSavingMethods] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setSettings(data as PlatformSettings);
          setWhatsapp(data.whatsapp_number ?? "");
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    const digits = normalizePhoneForWhatsApp(whatsapp);
    if (!digits) {
      toast.error("Merci de renseigner un numéro WhatsApp valide.");
      return;
    }
    setSavingWhatsapp(true);
    const { error } = await supabase.from("platform_settings").update({ whatsapp_number: digits }).eq("id", 1);
    setSavingWhatsapp(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setWhatsapp(digits);
    setSettings((s) => ({ ...s, whatsapp_number: digits }));
    toast.success("Numéro WhatsApp enregistré");
  }

  async function savePaymentMethods(e: React.FormEvent) {
    e.preventDefault();
    setSavingMethods(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({
        mtn_enabled: settings.mtn_enabled,
        mtn_number: settings.mtn_number,
        airtel_enabled: settings.airtel_enabled,
        airtel_number: settings.airtel_number,
        moov_enabled: settings.moov_enabled,
        moov_number: settings.moov_number,
        bank_enabled: settings.bank_enabled,
        bank_name: settings.bank_name,
        bank_account_number: settings.bank_account_number,
        bank_account_holder: settings.bank_account_holder,
      })
      .eq("id", 1);
    setSavingMethods(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Moyens de paiement enregistrés");
  }

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Chargement...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy">Paiements de la plateforme</h1>
        <p className="mt-1 text-sm text-gray-500">
          AchaVite collecte le paiement du client pour chaque commande, garde sa commission puis
          reverse le solde au vendeur. Ces réglages s&apos;appliquent à toute la marketplace.
        </p>
      </div>

      <form onSubmit={saveWhatsapp} className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
            <MessageCircle size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Confirmation WhatsApp</h2>
            <p className="text-xs text-gray-500">
              Numéro qui reçoit les commandes des clients pour confirmer leur paiement.
            </p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Numéro WhatsApp (avec indicatif pays, ex : 235 66 00 00 00)
        </label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="235 66 00 00 00"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
        {normalizePhoneForWhatsApp(whatsapp) && (
          <p className="mt-2 text-xs text-gray-400">Lien généré : wa.me/{normalizePhoneForWhatsApp(whatsapp)}</p>
        )}

        <button
          disabled={savingWhatsapp}
          className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {savingWhatsapp ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      <form onSubmit={savePaymentMethods} className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
            <Smartphone size={20} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Moyens de paiement</h2>
            <p className="text-xs text-gray-500">
              Active les moyens que les clients peuvent choisir pour payer leur commande.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {MOBILE_METHODS.map(({ key, label, color }) => {
            const enabledKey = `${key}_enabled` as const;
            const numberKey = `${key}_number` as const;
            const enabled = settings[enabledKey];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border-2 p-3 transition-colors",
                  enabled ? "border-orange/40 bg-orange-light/30" : "border-gray-200"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold", color)}>
                      {label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-navy">{label}</span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setSettings((s) => ({ ...s, [enabledKey]: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-orange" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </label>
                </div>
                {enabled && (
                  <input
                    value={settings[numberKey] ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, [numberKey]: e.target.value }))}
                    placeholder="Numéro qui reçoit les paiements"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                  />
                )}
              </div>
            );
          })}

          <div
            className={cn(
              "rounded-lg border-2 p-3 transition-colors",
              settings.bank_enabled ? "border-orange/40 bg-orange-light/30" : "border-gray-200"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white">
                  <Landmark size={16} />
                </span>
                <span className="text-sm font-semibold text-navy">Virement bancaire</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.bank_enabled}
                  onChange={(e) => setSettings((s) => ({ ...s, bank_enabled: e.target.checked }))}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-orange" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
              </label>
            </div>
            {settings.bank_enabled && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={settings.bank_name ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, bank_name: e.target.value }))}
                  placeholder="Nom de la banque"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange sm:col-span-2"
                />
                <input
                  value={settings.bank_account_number ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, bank_account_number: e.target.value }))}
                  placeholder="Numéro de compte / IBAN"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                />
                <input
                  value={settings.bank_account_holder ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, bank_account_holder: e.target.value }))}
                  placeholder="Titulaire du compte"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-navy/5 p-3 text-xs text-navy/70">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-navy" />
          Chaque client reçoit un lien de paiement sécurisé selon le moyen choisi pour finaliser sa
          commande. Vous validez ensuite manuellement la commande dans « Commandes », ce qui
          déclenche automatiquement la livraison par email des produits numériques.
        </div>

        <button
          disabled={savingMethods}
          className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {savingMethods ? "Enregistrement..." : "Enregistrer les moyens de paiement"}
        </button>
      </form>
    </div>
  );
}
