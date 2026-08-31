"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PartyPopper, MessageCircle, ArrowRight } from "lucide-react";
import { useShopStore } from "@/lib/store/shop";
import { formatFCFA } from "@/lib/format";
import { buildOrderWhatsAppLink, PAYMENT_METHOD_LABELS } from "@/lib/whatsapp";
import { EmptyState } from "@/components/ui/EmptyState";

const DELIVERY_LABELS: Record<string, string> = {
  domicile: "Livraison à domicile",
  relais: "Point relais",
  boutique: "Retrait en boutique",
};

export function ConfirmationPageClient({ orderId }: { orderId: string }) {
  const orders = useShopStore((s) => s.orders);
  const products = useShopStore((s) => s.products);
  const whatsappNumber = useShopStore((s) => s.settings.whatsappNumber);
  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Commande introuvable"
          description="Nous ne trouvons pas cette commande."
          actionLabel="Retour à l'accueil"
          actionHref="/"
        />
      </div>
    );
  }

  const isPaid = order.paymentStatus === "reussi";
  const waLink = buildOrderWhatsAppLink(order, whatsappNumber);
  const hasDigitalItem = order.items.some(
    (it) => (products.find((p) => p.id === it.productId)?.files.length ?? 0) > 0
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-10 text-center sm:px-6">
      {isPaid ? (
        <>
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-light text-orange">
            <PartyPopper size={30} />
          </span>
          <h1 className="text-xl font-bold text-navy sm:text-2xl">Commande confirmée 🎉</h1>
          <p className="mt-2 text-sm text-gray-500">
            Merci {order.customer.name.split(" ")[0]} ! Votre commande a été enregistrée avec
            succès.
          </p>
        </>
      ) : (
        <>
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <MessageCircle size={30} />
          </span>
          <h1 className="text-xl font-bold text-navy sm:text-2xl">Commande enregistrée</h1>
          <p className="mt-2 text-sm text-gray-500">
            Merci {order.customer.name.split(" ")[0]} ! Finalisez votre paiement dans la
            conversation WhatsApp qui vient de s&apos;ouvrir pour confirmer votre commande.
          </p>
        </>
      )}

      <div className="mt-6 space-y-3 rounded-xl bg-white p-5 text-left ring-1 ring-black/5">
        <Row label="Numéro de commande" value={order.code} />
        <Row label="Montant total" value={formatFCFA(order.total)} />
        <Row label="Mode de paiement" value={PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} />
        <Row label="Mode de livraison" value={DELIVERY_LABELS[order.deliveryMode]} />
        {order.deliveryMode === "domicile" && (
          <Row label="Adresse" value={`${order.customer.address}, ${order.customer.city}`} />
        )}
        {order.deliveryMode === "relais" && order.relaisPoint && (
          <Row label="Point relais" value={order.relaisPoint} />
        )}
        <Row
          label="Livraison estimée"
          value={new Date(order.estimatedDelivery).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        />
      </div>

      {hasDigitalItem && (
        <div className="mt-6 rounded-xl bg-navy/5 p-4 text-sm text-navy">
          {order.digitalDelivered
            ? "Votre produit numérique a été envoyé par email 📩"
            : `Votre commande contient un produit numérique : il sera envoyé à ${order.customer.email ?? "votre email"} dès la validation du paiement.`}
        </div>
      )}

      {!isPaid && waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold text-white hover:opacity-90"
        >
          <MessageCircle size={18} />
          Rouvrir WhatsApp
        </a>
      )}

      <Link
        href={`/suivi?code=${order.code}`}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-orange/25 hover:bg-orange-dark"
      >
        Suivre ma commande
        <ArrowRight size={18} />
      </Link>
      <Link href="/catalogue" className="mt-3 block text-sm font-medium text-navy hover:text-orange">
        Continuer mes achats
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gray-50 pb-3 text-sm last:border-0 last:pb-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-right font-semibold text-navy">{value}</span>
    </div>
  );
}
