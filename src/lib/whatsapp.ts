import { formatFCFA } from "./format";
import type { DeliveryMode } from "./db/types";

export type PaymentMethodKey = "mtn" | "airtel" | "moov" | "banque";

const DELIVERY_LABELS: Record<DeliveryMode, string> = {
  domicile: "Livraison à domicile",
  relais: "Point relais",
  boutique: "Retrait en boutique",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodKey, string> = {
  mtn: "MTN Mobile Money",
  airtel: "Airtel Money",
  moov: "Moov Money",
  banque: "Virement bancaire",
};

export type WhatsAppOrderInput = {
  code: string;
  items: { name: string; price: number; quantity: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryMode: DeliveryMode;
  customerName: string;
  customerPhone: string;
  customerCity: string | null;
  paymentMethod: PaymentMethodKey;
};

/** Builds the pre-filled message sent to AchaVite's payment-confirmation WhatsApp number. */
export function buildOrderWhatsAppMessage(order: WhatsAppOrderInput): string {
  const lines = [
    `Bonjour AchaVite 👋`,
    ``,
    `Je viens d'effectuer le paiement de ma commande *${order.code}* via ${PAYMENT_METHOD_LABELS[order.paymentMethod]}.`,
    ``,
    `Articles :`,
    ...order.items.map((it) => `• ${it.name} x${it.quantity} — ${formatFCFA(it.price * it.quantity)}`),
    ``,
    `Sous-total : ${formatFCFA(order.subtotal)}`,
    ...(order.discount > 0 ? [`Réduction : -${formatFCFA(order.discount)}`] : []),
    `Livraison : ${formatFCFA(order.deliveryFee)} (${DELIVERY_LABELS[order.deliveryMode]})`,
    `Total payé : ${formatFCFA(order.total)}`,
    ``,
    `Nom : ${order.customerName}`,
    `Téléphone : ${order.customerPhone}`,
    `Ville : ${order.customerCity ?? ""}`,
    ``,
    `Merci de confirmer la réception de mon paiement.`,
  ];
  return lines.join("\n");
}

/** Normalizes a phone number to digits only, for use in a wa.me link. */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Builds the wa.me deep link for a given order. Returns null when no
 * platform WhatsApp number has been configured yet (see /super-admin/paiements).
 */
export function buildOrderWhatsAppLink(order: WhatsAppOrderInput, whatsappNumber: string | null): string | null {
  const digits = normalizePhoneForWhatsApp(whatsappNumber ?? "");
  if (!digits) return null;
  const message = buildOrderWhatsAppMessage(order);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
