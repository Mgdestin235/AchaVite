"use client";

import { useState } from "react";
import { MessageCircle, ShieldCheck, Smartphone, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";
import type { MobileMoneyConfig, BankTransferConfig } from "@/lib/types";
import { cn } from "@/lib/cn";

const MOBILE_METHODS: { key: "mtn" | "airtel" | "moov"; color: string }[] = [
  { key: "mtn", color: "bg-yellow-400 text-navy" },
  { key: "airtel", color: "bg-red-500 text-white" },
  { key: "moov", color: "bg-blue-500 text-white" },
];

export default function AdminSettingsPage() {
  const settings = useShopStore((s) => s.settings);
  const updateSettings = useShopStore((s) => s.updateSettings);

  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber);
  const [methods, setMethods] = useState(settings.paymentMethods);

  function saveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    const digits = normalizePhoneForWhatsApp(whatsapp);
    if (!digits) {
      toast.error("Merci de renseigner un numéro WhatsApp valide.");
      return;
    }
    updateSettings({ whatsappNumber: digits });
    setWhatsapp(digits);
    toast.success("Numéro WhatsApp enregistré");
  }

  function updateMobile(key: "mtn" | "airtel" | "moov", patch: Partial<MobileMoneyConfig>) {
    setMethods({ ...methods, [key]: { ...methods[key], ...patch } });
  }

  function updateBanque(patch: Partial<BankTransferConfig>) {
    setMethods({ ...methods, banque: { ...methods.banque, ...patch } });
  }

  function savePaymentMethods(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ paymentMethods: methods });
    toast.success("Moyens de paiement enregistrés");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-navy">Paramètres</h1>

      <form onSubmit={saveWhatsapp} className="rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
            <MessageCircle size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Confirmation WhatsApp</h2>
            <p className="text-xs text-gray-500">
              Numéro qui reçoit les commandes pour confirmer le paiement.
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
          <p className="mt-2 text-xs text-gray-400">
            Lien généré : wa.me/{normalizePhoneForWhatsApp(whatsapp)}
          </p>
        )}

        <button className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark">
          Enregistrer
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
              Active les moyens que tes clients peuvent choisir au paiement.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {MOBILE_METHODS.map(({ key, color }) => {
            const m = methods[key];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border-2 p-3 transition-colors",
                  m.enabled ? "border-orange/40 bg-orange-light/30" : "border-gray-200"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold", color)}>
                      {m.label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-navy">{m.label}</span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) => updateMobile(key, { enabled: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-orange" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </label>
                </div>
                {m.enabled && (
                  <input
                    value={m.number}
                    onChange={(e) => updateMobile(key, { number: e.target.value })}
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
              methods.banque.enabled ? "border-orange/40 bg-orange-light/30" : "border-gray-200"
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
                  checked={methods.banque.enabled}
                  onChange={(e) => updateBanque({ enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-orange" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
              </label>
            </div>
            {methods.banque.enabled && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={methods.banque.bankName}
                  onChange={(e) => updateBanque({ bankName: e.target.value })}
                  placeholder="Nom de la banque"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange sm:col-span-2"
                />
                <input
                  value={methods.banque.accountNumber}
                  onChange={(e) => updateBanque({ accountNumber: e.target.value })}
                  placeholder="Numéro de compte / IBAN"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                />
                <input
                  value={methods.banque.accountHolder}
                  onChange={(e) => updateBanque({ accountHolder: e.target.value })}
                  placeholder="Titulaire du compte"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-navy/5 p-3 text-xs text-navy/70">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-navy" />
          Ces moyens ne sont pas connectés à une passerelle de paiement automatique : le client
          voit les coordonnées, effectue le transfert de son côté puis confirme via WhatsApp.
          Vous validez ensuite la commande manuellement.
        </div>

        <button className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark">
          Enregistrer les moyens de paiement
        </button>
      </form>
    </div>
  );
}
