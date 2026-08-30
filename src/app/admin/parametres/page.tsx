"use client";

import { useState } from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useShopStore } from "@/lib/store/shop";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

export default function AdminSettingsPage() {
  const whatsappNumber = useShopStore((s) => s.settings.whatsappNumber);
  const updateSettings = useShopStore((s) => s.updateSettings);
  const [value, setValue] = useState(whatsappNumber);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = normalizePhoneForWhatsApp(value);
    if (!digits) {
      toast.error("Merci de renseigner un numéro WhatsApp valide.");
      return;
    }
    updateSettings({ whatsappNumber: digits });
    setValue(digits);
    toast.success("Numéro WhatsApp enregistré");
  }

  const preview = normalizePhoneForWhatsApp(value);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-navy">Paramètres</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-xl bg-white p-4 ring-1 ring-black/5 sm:p-5"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
            <MessageCircle size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-navy">Paiement WhatsApp</h2>
            <p className="text-xs text-gray-500">
              Numéro qui recevra les commandes à finaliser sur WhatsApp.
            </p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Numéro WhatsApp (avec indicatif pays, ex : 235 66 00 00 00)
        </label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="235 66 00 00 00"
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
        />

        {preview && (
          <p className="mt-2 text-xs text-gray-400">
            Lien généré : wa.me/{preview}
          </p>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-navy/5 p-3 text-xs text-navy/70">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-navy" />
          Ce numéro doit être actif sur WhatsApp ou WhatsApp Business. Chaque commande envoyée
          inclut automatiquement son numéro pour que vous puissiez la retrouver et confirmer le
          paiement facilement.
        </div>

        <button className="mt-4 w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
