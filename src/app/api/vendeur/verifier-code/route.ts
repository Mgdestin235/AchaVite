import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Read-only pre-check for the account-creation form: is this access code a
 * payment that a Super Admin has actually confirmed and that hasn't been
 * used yet? Returns the paid email so the form can lock it. The real
 * enforcement still happens in /api/vendeur/creer-compte -- this endpoint
 * only decides what the form shows.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { accessCode } = (await request.json()) as { accessCode?: string };
  const code = (accessCode ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("vendor_applications")
    .select("email, plan_code, status")
    .eq("access_code", code)
    .maybeSingle();

  if (!data || data.status !== "confirmed") {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({ valid: true, email: data.email, planCode: data.plan_code });
}
