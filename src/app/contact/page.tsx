"use client";

import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    toast.success("Message envoyé ! Notre équipe vous répondra rapidement.");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Contactez-nous</h1>
      <p className="mb-6 text-sm text-gray-500">
        Une question ? Notre équipe est là pour vous aider.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center ring-1 ring-black/5">
          <Phone className="text-orange" size={20} />
          <span className="text-xs font-semibold text-navy">+235 66 00 00 00</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center ring-1 ring-black/5">
          <Mail className="text-orange" size={20} />
          <span className="text-xs font-semibold text-navy">contact@achavite.td</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center ring-1 ring-black/5">
          <MapPin className="text-orange" size={20} />
          <span className="text-xs font-semibold text-navy">Afrique</span>
        </div>
      </div>

      {sent ? (
        <div className="rounded-xl bg-orange-light p-5 text-center text-sm font-semibold text-orange-dark">
          Merci, votre message a bien été envoyé.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Votre nom"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <input
            required
            type="tel"
            placeholder="Votre téléphone"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <textarea
            required
            rows={4}
            placeholder="Votre message"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange"
          />
          <button className="w-full rounded-xl bg-orange py-3 text-sm font-bold text-white hover:bg-orange-dark">
            Envoyer le message
          </button>
        </form>
      )}
    </div>
  );
}
