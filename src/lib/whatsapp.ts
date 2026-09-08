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
 * Comparison key for "is this the same phone number", regardless of whether
 * either side included the +235 country code, leading zeros, or spaces.
 * Chad local numbers are 8 digits, so comparing the last 8 digits matches
 * "+235 66 12 34 56", "235 66123456" and "66123456" as the same number.
 * Never use this for the wa.me link itself -- that needs the full
 * international number from normalizePhoneForWhatsApp().
 */
export function phoneMatchKey(phone: string): string {
  const digits = normalizePhoneForWhatsApp(phone);
  return digits.slice(-8);
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

export type WhatsAppSubscriptionInput = {
  storeName: string;
  label: string;
  amount: number;
  currencySymbol: string;
  reference: string;
};

/**
 * Same manual-confirmation pattern as buildOrderWhatsAppLink(), but for a
 * vendor paying AchaVite directly (trial fee / PRO subscription) rather
 * than a customer paying a vendor. Kept separate from the order message
 * builder since these are two distinct money flows (see
 * 0004_monetization.sql) that must never be confused in the confirmation
 * text a Super Admin reads.
 */
export function buildSubscriptionWhatsAppMessage(input: WhatsAppSubscriptionInput): string {
  const lines = [
    `Bonjour AchaVite 👋`,
    ``,
    `Je viens d'effectuer le paiement pour : *${input.label}*.`,
    `Montant : ${input.amount.toLocaleString("fr-FR")} ${input.currencySymbol}`,
    `Boutique : ${input.storeName}`,
    `Référence : ${input.reference}`,
    ``,
    `Merci de confirmer la réception de mon paiement pour activer mon abonnement.`,
  ];
  return lines.join("\n");
}

export function buildSubscriptionWhatsAppLink(
  input: WhatsAppSubscriptionInput,
  whatsappNumber: string | null
): string | null {
  const digits = normalizePhoneForWhatsApp(whatsappNumber ?? "");
  if (!digits) return null;
  const message = buildSubscriptionWhatsAppMessage(input);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
