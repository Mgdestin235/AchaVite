"use client";

import Image from "next/image";
import { Printer } from "lucide-react";
import type { Invoice } from "@/lib/db/types";

/**
 * Real PDF generation is deferred (no PDF library in this project yet) --
 * this is an honest, print-friendly HTML view instead. "Télécharger"
 * triggers the browser's own print-to-PDF, which works everywhere with no
 * new dependency.
 */
export function InvoiceView({ invoice, storeName }: { invoice: Invoice; storeName: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-dark"
        >
          <Printer size={16} />
          Imprimer / Télécharger en PDF
        </button>
      </div>

      <div className="rounded-2xl bg-white p-8 ring-1 ring-black/5">
        <div className="mb-6 flex items-center justify-between">
          <Image src="/brand/logo-full.png" alt="AchaVite" width={140} height={107} className="h-10 w-auto" />
          <div className="text-right">
            <p className="text-lg font-bold text-navy">Facture</p>
            <p className="text-sm text-gray-500">{invoice.invoice_number}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Facturé à</p>
            <p className="font-semibold text-navy">{storeName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Date</p>
            <p className="font-semibold text-navy">
              {new Date(invoice.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {(invoice.period_start || invoice.period_end) && (
          <p className="mb-4 text-sm text-gray-500">
            Période couverte : {invoice.period_start ?? "—"} → {invoice.period_end ?? "—"}
          </p>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between text-base font-bold text-navy">
            <span>Montant</span>
            <span>
              {Number(invoice.amount).toLocaleString("fr-FR")} {invoice.currency_code}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Statut : {invoice.status}</p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          AchaVite — Les meilleures bonnes affaires à portée de main.
        </p>
      </div>
    </div>
  );
}
