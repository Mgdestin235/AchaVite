import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

type LookupBody = { code?: string; phone?: string };

const ORDER_SELECT =
  "*, order_items(id, store_id, product_id, name, image, price, quantity, subtotal, status, stores(name))";

/**
 * Guest order tracking. Orders RLS deliberately does not expose
 * customer_id-is-null rows to anon selects (see 0001_marketplace_schema.sql),
 * so this route uses the service-role key and only returns a row once the
 * caller has proven they know both the order code AND the phone number
 * used to place it.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { code, phone } = (await request.json()) as LookupBody;
  if (!code?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Code de commande et téléphone requis." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .ilike("code", code.trim())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order || normalizePhoneForWhatsApp(order.customer_phone) !== normalizePhoneForWhatsApp(phone)) {
    return NextResponse.json({ error: "Aucune commande trouvée avec ce code et ce téléphone." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
