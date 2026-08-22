"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/cn";

const METHODS: { value: PaymentMethod; label: string; hint: string; color: string }[] = [
  { value: "mtn", label: "MTN Mobile Money", hint: "Paiement mobile", color: "bg-yellow-400 text-navy" },
  { value: "orange", label: "Orange Money", hint: "Paiement mobile", color: "bg-orange text-white" },
  { value: "wave", label: "Wave", hint: "Paiement mobile", color: "bg-sky-400 text-white" },
  { value: "carte", label: "Carte bancaire", hint: "Via CinetPay", color: "bg-navy text-white" },
];

export function PaiementPageClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const orders = useShopStore((s) => s.orders);
  const setOrderPaymentStatus = useShopStore((s) => s.setOrderPaymentStatus);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const [method, setMethod] = useState<PaymentMethod>("mtn");
  const [status, setStatus] = useState<"idle" | "processing" | "failed">("idle");

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

  function processPayment() {
    setStatus("processing");
    setTimeout(() => {
      const success = Math.random() > 0.12;
      if (success) {
        setOrderPaymentStatus(order!.id, "reussi", method);
        router.push(`/confirmation?commande=${order!.id}`);
      } else {
        setOrderPaymentStatus(order!.id, "echoue", method);
        setStatus("failed");
      }
    }, 1800);
  }

  if (status === "processing") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <Loader2 size={40} className="animate-spin text-orange" />
        <p className="text-sm font-medium text-navy">Vérification du paiement en cours...</p>
        <p className="text-xs text-gray-400">Ne fermez pas cette page.</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
          <XCircle size={32} />
        </span>
        <h1 className="text-lg font-bold text-navy">Paiement non effectué</h1>
        <p className="mt-2 text-sm text-gray-500">
          Votre paiement n&apos;a pas pu être confirmé. Vérifiez votre solde ou choisissez un autre
          moyen de paiement.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 w-full rounded-xl bg-orange py-3.5 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Paiement</h1>
      <p className="mb-5 text-sm text-gray-500">
        Commande {order.code} — {formatFCFA(order.total)}
      </p>

      <div className="space-y-2">
        {METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors",
              method === m.value ? "border-orange bg-orange-light/40" : "border-gray-200"
            )}
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold", m.color)}>
              {m.label.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy">{m.label}</span>
              <span className="block text-xs text-gray-400">{m.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-lg bg-navy/5 p-3 text-xs text-navy/70">
        <ShieldCheck size={16} className="shrink-0 text-navy" />
        Paiement sécurisé via la passerelle CinetPay. Vos informations bancaires ne sont jamais
        stockées par AchaVite.
      </div>

      <button
        onClick={processPayment}
        className="mt-5 w-full rounded-xl bg-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-orange/25 hover:bg-orange-dark active:scale-95"
      >
        Payer {formatFCFA(order.total)}
      </button>
    </div>
  );
}
