import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Body = { orderId?: string; method?: string };

const VALID_METHODS = ["mtn", "airtel", "moov", "banque"];

/**
 * Records which payment method a guest chose at /paiement. Not gated by
 * anything beyond knowing the order's id (a random UUID): this only sets
 * an informational field and never touches payment_status, which stays
 * admin-controlled (see /super-admin/orders).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { orderId, method } = (await request.json()) as Body;
  if (!orderId || !method || !VALID_METHODS.includes(method)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("orders").update({ payment_method: method }).eq("id", orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
