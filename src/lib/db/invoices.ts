import type { SupabaseClient } from "@supabase/supabase-js";
import type { Invoice } from "./types";

export async function getInvoiceByPaymentId(
  supabase: SupabaseClient,
  paymentId: string
): Promise<Invoice | null> {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("subscription_payment_id", paymentId)
    .maybeSingle();
  return (data as Invoice) ?? null;
}

export async function listInvoicesForStore(supabase: SupabaseClient, storeId: string): Promise<Invoice[]> {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  return (data as Invoice[]) ?? [];
}

export type InvoiceWithStore = Invoice & { stores: { name: string } | null };

/** Super Admin: every invoice, across all vendors. */
export async function listAllInvoices(supabase: SupabaseClient): Promise<InvoiceWithStore[]> {
  const { data } = await supabase
    .from("invoices")
    .select("*, stores(name)")
    .order("created_at", { ascending: false });
  return (data as unknown as InvoiceWithStore[]) ?? [];
}
