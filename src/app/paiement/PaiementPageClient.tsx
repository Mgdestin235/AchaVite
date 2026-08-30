"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { buildOrderWhatsAppLink } from "@/lib/whatsapp";
import { EmptyState } from "@/components/ui/EmptyState";

export function PaiementPageClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const orders = useShopStore((s) => s.orders);
  const whatsappNumber = useShopStore((s) => s.settings.whatsappNumber);
  const setOrderPaymentStatus = useShopStore((s) => s.setOrderPaymentStatus);
  const setOrderStatus = useShopStore((s) => s.setOrderStatus);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

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

  const waLink = buildOrderWhatsAppLink(order, whatsappNumber);

  function handleContinue() {
    if (!waLink) return;
    setOrderPaymentStatus(order!.id, "attente", "whatsapp");
    setOrderStatus(order!.id, "paiement_attente");
    window.open(waLink, "_blank", "noopener,noreferrer");
    router.push(`/confirmation?commande=${order!.id}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-navy sm:text-2xl">Paiement</h1>
      <p className="mb-5 text-sm text-gray-500">
        Commande {order.code} — {formatFCFA(order.total)}
      </p>

      <div className="rounded-xl border-2 border-[#25D366]/30 bg-[#25D366]/5 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
            <MessageCircle size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-navy">Paiement via WhatsApp</p>
            <p className="text-xs text-gray-500">
              Discutez directement avec AchaVite pour finaliser votre paiement.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-lg bg-navy/5 p-3 text-xs text-navy/70">
        <ShieldCheck size={16} className="shrink-0 text-navy" />
        WhatsApp chiffre vos messages de bout en bout. Le lien ci-dessous ouvre une conversation
        directe avec AchaVite, référencée à votre commande {order.code} — vos informations
        bancaires ne sont jamais demandées par ce moyen.
      </div>

      {waLink ? (
        <button
          onClick={handleContinue}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#25D366]/25 hover:opacity-90 active:scale-95"
        >
          <MessageCircle size={18} />
          Continuer sur WhatsApp
        </button>
      ) : (
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Le paiement WhatsApp n&apos;est pas encore configuré. Rendez-vous dans Admin →
          Paramètres pour renseigner le numéro WhatsApp de la boutique.
        </div>
      )}
    </div>
  );
}
