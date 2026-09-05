import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderStatus } from "./types";

export type VendorOrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  vendor_payout: number;
  status: OrderStatus;
  orders: {
    code: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_mode: string;
    payment_status: string;
    created_at: string;
  } | null;
  products: {
    id: string;
    product_files: { name: string; url: string }[];
  } | null;
};

const SELECT =
  "id, order_id, product_id, name, image, price, quantity, subtotal, vendor_payout, status, " +
  "orders(code, customer_name, customer_phone, customer_email, delivery_mode, payment_status, created_at), " +
  "products(id, product_files(name, url))";

export async function listVendorOrderItems(
  supabase: SupabaseClient,
  storeId: string
): Promise<VendorOrderItemRow[]> {
  const { data } = await supabase
    .from("order_items")
    .select(SELECT)
    .eq("store_id", storeId)
    .order("id", { ascending: false });
  return (data as unknown as VendorOrderItemRow[]) ?? [];
}

export async function updateOrderItemStatus(
  supabase: SupabaseClient,
  itemId: string,
  status: OrderStatus
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("order_items").update({ status }).eq("id", itemId);
  return { error: error?.message ?? null };
}
