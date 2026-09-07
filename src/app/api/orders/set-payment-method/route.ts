import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { phoneMatchKey } from "@/lib/whatsapp";

type Body = { orderId?: string; phone?: string; method?: string };

const VALID_METHODS = ["mtn", "airtel", "moov", "banque"];

/**
 * Records which payment method a guest chose at /paiement. This only sets
 * an informational field and never touches payment_status (the orders
 * table's own force_order_admin_fields trigger blocks that for non-admins
 * regardless), but still requires the caller to know the order's phone
 * number -- not just its id -- since the id otherwise leaks into the
 * Referer/browser history via the /confirmation?commande=<id> URL.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { orderId, phone, method } = (await request.json()) as Body;
  if (!orderId || !phone?.trim() || !method || !VALID_METHODS.includes(method)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("customer_phone").eq("id", orderId).maybeSingle();
  if (!order || phoneMatchKey(order.customer_phone) !== phoneMatchKey(phone)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 404 });
  }

  const { error } = await supabase.from("orders").update({ payment_method: method }).eq("id", orderId);
  if (error) return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
