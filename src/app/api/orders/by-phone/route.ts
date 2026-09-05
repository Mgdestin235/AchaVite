import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

type ByPhoneBody = { phone?: string };

const ORDER_SELECT = "*, order_items(id, name, image, quantity, price)";

/**
 * "Mes commandes" for guest customers who never created a real account:
 * matches on phone number only. This is a weaker guarantee than the
 * code+phone lookup in /api/orders/lookup (a phone number alone isn't a
 * strong secret), accepted here as the same trade-off the phone-only
 * "compte" flow always made — it never asks for a password.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { phone } = (await request.json()) as ByPhoneBody;
  const digits = normalizePhoneForWhatsApp(phone ?? "");
  if (!digits) {
    return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data ?? []).filter(
    (o) => normalizePhoneForWhatsApp(o.customer_phone) === digits
  );

  return NextResponse.json({ orders });
}
