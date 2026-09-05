import type { OrderRow, OrderStatus } from "./db/types";

export type OrderItemWithStore = {
  id: string;
  store_id: string;
  product_id: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  status: OrderStatus;
  stores: { name: string } | null;
};

export type OrderWithItems = OrderRow & { order_items: OrderItemWithStore[] };

export async function lookupOrderByCodeAndPhone(
  code: string,
  phone: string
): Promise<{ order: OrderWithItems | null; error: string | null }> {
  const res = await fetch("/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { order: null, error: data.error || "Commande introuvable." };
  return { order: data.order as OrderWithItems, error: null };
}

export type OrderSummary = OrderRow & {
  order_items: { id: string; name: string; image: string | null; quantity: number; price: number }[];
};

export async function listOrdersByPhone(phone: string): Promise<{ orders: OrderSummary[]; error: string | null }> {
  const res = await fetch("/api/orders/by-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { orders: [], error: data.error || "Une erreur est survenue." };
  return { orders: (data.orders as OrderSummary[]) ?? [], error: null };
}
