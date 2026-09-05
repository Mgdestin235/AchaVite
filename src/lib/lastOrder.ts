import type { DeliveryMode } from "./db/types";
import type { PaymentMethodKey } from "./whatsapp";

/**
 * Guest checkout has no session to re-fetch from (orders RLS deliberately
 * refuses anon selects on customer_id-is-null rows, see
 * 0001_marketplace_schema.sql) — so /checkout hands the just-created order
 * straight to /paiement and /confirmation via sessionStorage instead of
 * asking the database for it again.
 */
export type LastOrder = {
  id: string;
  code: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryMode: DeliveryMode;
  relaisPoint?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity: string;
  customerAddress?: string;
  estimatedDelivery: string;
  items: { name: string; image: string | null; price: number; quantity: number; hasFiles: boolean }[];
  paymentMethod?: PaymentMethodKey;
  whatsappLink?: string;
  paymentStatus: "attente" | "reussi" | "echoue" | "annule";
  digitalDelivered: boolean;
};

const KEY = "achavite-last-order";

export function saveLastOrder(order: LastOrder) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // sessionStorage can throw in private-browsing contexts; the order
    // still exists server-side, only this client-side handoff is lost.
  }
}

export function loadLastOrder(orderId: string): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrder;
    return parsed.id === orderId ? parsed : null;
  } catch {
    return null;
  }
}

export function updateLastOrder(patch: Partial<LastOrder>) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as LastOrder;
    sessionStorage.setItem(KEY, JSON.stringify({ ...parsed, ...patch }));
  } catch {
    // best-effort only, see saveLastOrder
  }
}
