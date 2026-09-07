import type { SupabaseClient } from "@supabase/supabase-js";
import { orderCode } from "@/lib/format";
import type { DeliveryMode, OrderRow, OrderStatus } from "./types";

export type NewOrderItemInput = {
  productId: string | null;
  storeId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
};

export type NewOrderInput = {
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
    neighborhood?: string;
  };
  items: NewOrderItemInput[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  total: number;
  deliveryMode: DeliveryMode;
  relaisPoint?: string;
};

export async function createOrder(
  supabase: SupabaseClient,
  input: NewOrderInput
): Promise<{ order: OrderRow | null; error: string | null }> {
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("commission_percent")
    .eq("id", 1)
    .maybeSingle();
  const commissionPercent = settings?.commission_percent ?? 10;

  const estimatedDelivery = new Date(Date.now() + 3 * 86400000).toISOString();

  // orders.code has a unique constraint; retry with a freshly generated
  // id/code on a collision rather than surfacing a raw Postgres error.
  let order: OrderRow | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    const id = crypto.randomUUID();
    const code = orderCode(id);
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id,
        code,
        customer_id: input.customer.id ?? null,
        customer_name: input.customer.name,
        customer_phone: input.customer.phone,
        customer_email: input.customer.email || null,
        customer_city: input.customer.city,
        customer_address: input.customer.address,
        customer_neighborhood: input.customer.neighborhood || null,
        subtotal: input.subtotal,
        discount: input.discount,
        promo_code: input.promoCode || null,
        delivery_fee: input.deliveryFee,
        total: input.total,
        delivery_mode: input.deliveryMode,
        relais_point: input.relaisPoint || null,
        payment_status: "attente",
        status: "nouvelle",
        estimated_delivery: estimatedDelivery,
      })
      .select("*")
      .single();

    if (!error) {
      order = data as OrderRow;
      break;
    }
    lastError = error.message;
    if (error.code !== "23505") break; // not a unique-violation: retrying won't help
  }

  if (!order) return { order: null, error: lastError };
  const id = order.id;

  const itemRows = input.items.map((it) => {
    const subtotal = it.price * it.quantity;
    const commission_amount = Math.round((subtotal * commissionPercent) / 100);
    return {
      order_id: id,
      store_id: it.storeId,
      product_id: it.productId,
      name: it.name,
      image: it.image,
      price: it.price,
      quantity: it.quantity,
      subtotal,
      commission_amount,
      vendor_payout: subtotal - commission_amount,
      status: "nouvelle" as OrderStatus,
    };
  });

  // Price, commission, vendor payout, store_id and stock are all re-derived
  // server-side from the real product row by the order_items_recompute
  // trigger (see 0003_security_hardening.sql) -- what's sent here for those
  // fields is informational only and gets overwritten.
  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) return { order: order as OrderRow, error: itemsError.message };

  return { order: order as OrderRow, error: null };
}

/**
 * The customer-facing overall status of an order is the least-advanced
 * status among its items (an order isn't "delivered" until every vendor
 * has delivered their portion).
 */
const STATUS_ORDER: OrderStatus[] = ["nouvelle", "confirmee", "preparation", "expediee", "livree"];

export function resolveOverallStatus(itemStatuses: OrderStatus[]): OrderStatus {
  if (itemStatuses.some((s) => s === "annulee")) return "annulee";
  if (itemStatuses.length === 0) return "nouvelle";
  const minIndex = Math.min(...itemStatuses.map((s) => STATUS_ORDER.indexOf(s)).filter((i) => i >= 0));
  return STATUS_ORDER[minIndex] ?? "nouvelle";
}
