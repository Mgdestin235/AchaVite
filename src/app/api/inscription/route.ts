import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizePhone, syntheticEmailForPhone } from "@/lib/buyerAuth";

type Body = { name?: string; phone?: string; password?: string };

const PHONE_RE = /^\+[1-9]\d{7,14}$/; // E.164: + then 8-15 digits total

/**
 * Buyer signup with no email field in the UI -- name + phone only. Created
 * via the Admin API with email_confirm: true against a synthetic, never-
 * delivered internal email derived from the phone number (see
 * src/lib/buyerAuth.ts) -- the same trick already used for vendor accounts.
 * This fully bypasses Supabase's own confirmation-email step, so it never
 * touches the project's severely rate-limited built-in email sender (that
 * limit is exactly what "email rate limit exceeded" on the old email-based
 * signup was hitting), and needs no SMS provider either.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as Body;
  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const password = body.password ?? "";

  if (!name) {
    return NextResponse.json({ error: "Merci de renseigner votre nom complet." }, { status: 400 });
  }
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Numéro invalide. Utilisez le format international, ex : +2356600000." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: syntheticEmailForPhone(phone),
    password,
    email_confirm: true,
    user_metadata: { name, phone, role: "customer" },
  });

  if (error) {
    const msg = /already|exists|registered/i.test(error.message)
      ? "Un compte existe déjà avec ce numéro. Connectez-vous."
      : "Impossible de créer le compte. Réessayez.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
