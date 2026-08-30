import { formatFCFA } from "./format";
import type { Order } from "./types";

const DELIVERY_LABELS: Record<Order["deliveryMode"], string> = {
  domicile: "Livraison à domicile",
  relais: "Point relais",
  boutique: "Retrait en boutique",
};

/** Builds the pre-filled message sent to the store's WhatsApp number. */
export function buildOrderWhatsAppMessage(order: Order): string {
  const lines = [
    `Bonjour AchaVite 👋`,
    ``,
    `Je souhaite finaliser le paiement de ma commande *${order.code}*.`,
    ``,
    `Articles :`,
    ...order.items.map((it) => `• ${it.name} x${it.qty} — ${formatFCFA(it.price * it.qty)}`),
    ``,
    `Sous-total : ${formatFCFA(order.subtotal)}`,
    ...(order.discount > 0 ? [`Réduction : -${formatFCFA(order.discount)}`] : []),
    `Livraison : ${formatFCFA(order.deliveryFee)} (${DELIVERY_LABELS[order.deliveryMode]})`,
    `Total à payer : ${formatFCFA(order.total)}`,
    ``,
    `Nom : ${order.customer.name}`,
    `Téléphone : ${order.customer.phone}`,
    `Ville : ${order.customer.city}`,
    ``,
    `Merci de me confirmer les modalités de paiement.`,
  ];
  return lines.join("\n");
}

/** Normalizes a phone number to digits only, for use in a wa.me link. */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Builds the wa.me deep link for a given order. Returns null when no store
 * WhatsApp number has been configured yet (see /admin/parametres).
 */
export function buildOrderWhatsAppLink(order: Order, whatsappNumber: string): string | null {
  const digits = normalizePhoneForWhatsApp(whatsappNumber);
  if (!digits) return null;
  const message = buildOrderWhatsAppMessage(order);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
