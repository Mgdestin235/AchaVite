import type { SupabaseClient } from "@supabase/supabase-js";
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
  order_items: { id: string; name: string; image: string | null; quantity: number; price: number; status: OrderStatus }[];
};

/** For a logged-in buyer: RLS (customer_id = auth.uid()) scopes this to their own orders. */
export async function listOrdersForCustomer(supabase: SupabaseClient, customerId: string): Promise<OrderSummary[]> {
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(id, name, image, quantity, price, status)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return (data as OrderSummary[]) ?? [];
}
