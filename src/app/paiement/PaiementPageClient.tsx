"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShieldCheck, AlertTriangle, Landmark, Copy, Check } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { buildOrderWhatsAppLink, PAYMENT_METHOD_LABELS } from "@/lib/whatsapp";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/cn";

const MOBILE_COLORS: Record<string, string> = {
  mtn: "bg-yellow-400 text-navy",
  airtel: "bg-red-500 text-white",
  moov: "bg-blue-500 text-white",
};

export function PaiementPageClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const orders = useShopStore((s) => s.orders);
  const settings = useShopStore((s) => s.settings);
  const setOrderPaymentStatus = useShopStore((s) => s.setOrderPaymentStatus);
  const setOrderStatus = useShopStore((s) => s.setOrderStatus);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const [copied, setCopied] = useState<string | null>(null);

  const enabledMethods = (["mtn", "airtel", "moov", "banque"] as PaymentMethod[]).filter(
    (m) => settings.paymentMethods[m].enabled
  );
  const [method, setMethod] = useState<PaymentMethod | null>(enabledMethods[0] ?? null);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Commande introuvable"
          description="Cette commande n'existe pas ou a déjà été traitée."
          actionLabel="Retour à l'accueil"
          actionHref="/"
        />
      </div>
    );
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function handleContinue() {
    if (!method) return;
    const waLink = buildOrderWhatsAppLink({ ...order!, paymentMethod: method }, settings.whatsappNumber);
    if (!waLink) return;
    setOrderPaymentStatus(order!.id, "attente", method);
    setOrderStatus(order!.id, "paiement_attente");
    window.open(waLink, "_blank", "noopener,noreferrer");
    router.push(`/confirmation?commande=${order!.id}`);
  }

  const waConfigured = !!buildOrderWhatsAppLink({ ...order, paymentMethod: method ?? "mtn" }, settings.whatsappNumber);

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Paiement</h1>
      <p className="mb-5 text-sm text-gray-500">
        Commande {order.code} — {formatFCFA(order.total)}
      </p>

      {enabledMethods.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Aucun moyen de paiement n&apos;est encore configuré. Rendez-vous dans Admin →
          Paramètres pour activer au moins un moyen de paiement.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {enabledMethods.map((m) => {
              const label = PAYMENT_METHOD_LABELS[m];
              return (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors",
                    method === m ? "border-orange bg-orange-light/40" : "border-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      m === "banque" ? "bg-navy text-white" : MOBILE_COLORS[m]
                    )}
                  >
                    {m === "banque" ? <Landmark size={18} /> : label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-navy">{label}</span>
                </button>
              );
            })}
          </div>

          {method && method !== "banque" && (
            <div className="mt-4 rounded-xl bg-navy/5 p-4">
              <p className="text-sm text-navy">
                Envoyez <span className="font-bold">{formatFCFA(order.total)}</span> au numéro{" "}
                {PAYMENT_METHOD_LABELS[method]} ci-dessous, puis confirmez sur WhatsApp.
              </p>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-black/5">
                <span className="font-mono text-sm font-semibold text-navy">
                  {settings.paymentMethods[method].number}
                </span>
                <button
                  type="button"
                  onClick={() => copy(settings.paymentMethods[method].number)}
                  className="text-gray-400 hover:text-navy"
                >
                  {copied === settings.paymentMethods[method].number ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          {method === "banque" && (
            <div className="mt-4 space-y-2 rounded-xl bg-navy/5 p-4 text-sm text-navy">
              <p>
                Effectuez un virement de <span className="font-bold">{formatFCFA(order.total)}</span> vers
                le compte ci-dessous, puis confirmez sur WhatsApp.
              </p>
              <Row label="Banque" value={settings.paymentMethods.banque.bankName} onCopy={copy} copied={copied} />
              <Row label="Compte" value={settings.paymentMethods.banque.accountNumber} onCopy={copy} copied={copied} />
              <Row label="Titulaire" value={settings.paymentMethods.banque.accountHolder} onCopy={copy} copied={copied} />
            </div>
          )}

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-navy/5 p-3 text-xs text-navy/70">
            <ShieldCheck size={16} className="shrink-0 text-navy" />
            WhatsApp chiffre vos messages de bout en bout. Vos informations bancaires ne sont
            jamais demandées par ce moyen.
          </div>

          {waConfigured ? (
            <button
              onClick={handleContinue}
              disabled={!method}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <MessageCircle size={18} />
              J&apos;ai payé, confirmer sur WhatsApp
            </button>
          ) : (
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Le numéro WhatsApp de confirmation n&apos;est pas encore configuré (Admin →
              Paramètres).
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  copied: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-black/5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">{value}</span>
        <button type="button" onClick={() => onCopy(value)} className="text-gray-400 hover:text-navy">
          {copied === value ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
