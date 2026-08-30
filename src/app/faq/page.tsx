"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const FAQS = [
  {
    section: "livraison",
    question: "Quels sont les délais de livraison ?",
    answer: "Vos commandes sont généralement livrées sous 2 à 5 jours selon votre ville et le mode de livraison choisi.",
  },
  {
    section: "livraison",
    question: "Puis-je choisir un point relais ou un retrait en boutique ?",
    answer: "Oui, selon votre ville, vous pouvez choisir la livraison à domicile, un point relais ou le retrait en boutique lors du paiement.",
  },
  {
    section: "paiement",
    question: "Comment se passe le paiement ?",
    answer: "Après avoir validé votre commande, vous êtes redirigé vers WhatsApp pour finaliser le paiement directement avec l'équipe AchaVite, en toute simplicité.",
  },
  {
    section: "paiement",
    question: "Mes informations sont-elles en sécurité ?",
    answer: "Oui. AchaVite ne demande jamais vos informations bancaires. Les échanges se font via WhatsApp, chiffré de bout en bout, avec référence directe à votre commande.",
  },
  {
    section: "retours",
    question: "Puis-je retourner un produit ?",
    answer: "Oui, sous certaines conditions et dans les délais indiqués dans notre politique de retour. Contactez notre service client pour toute demande.",
  },
  {
    section: "general",
    question: "Dois-je créer un compte pour commander ?",
    answer: "Non, la création de compte est facultative. Vous pouvez commander avec simplement votre numéro de téléphone et suivre votre commande avec ce numéro.",
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Questions fréquentes</h1>
      <p className="mb-6 text-sm text-gray-500">Tout ce qu&apos;il faut savoir sur AchaVite.</p>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} id={faq.section} className="rounded-xl bg-white ring-1 ring-black/5">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-sm font-semibold text-navy">{faq.question}</span>
              <ChevronDown
                size={18}
                className={cn("shrink-0 text-gray-400 transition-transform", open === i && "rotate-180")}
              />
            </button>
            {open === i && (
              <p className="px-4 pb-4 text-sm text-gray-500">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
