import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

type Body = {
  accessCode?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The only way a vendor account gets created. It is gated on a
 * vendor_applications row that a Super Admin has marked 'confirmed' (i.e.
 * the Free/Pro fee was actually received) and that hasn't been consumed
 * yet. Everything runs with the service-role client so the check can't be
 * bypassed from the browser -- clicking "Payer" or hitting this URL
 * directly does nothing without a valid, confirmed, unconsumed code.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as Body;
  const accessCode = (body.accessCode ?? "").trim().toUpperCase();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const storeName = (body.storeName ?? "").trim();

  if (!accessCode) {
    return NextResponse.json({ error: "Code d'accès manquant." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }
  if (!firstName || !lastName || !phone || !storeName) {
    return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. The code must map to a confirmed, unconsumed application.
  const { data: application } = await admin
    .from("vendor_applications")
    .select("*")
    .eq("access_code", accessCode)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!application) {
    return NextResponse.json(
      { error: "Le paiement n'a pas été confirmé. Aucun compte vendeur n'a été créé. Vous pouvez réessayer." },
      { status: 403 }
    );
  }
  if (application.email.toLowerCase() !== email) {
    return NextResponse.json(
      { error: "Cette adresse e-mail ne correspond pas à celle utilisée lors du paiement." },
      { status: 403 }
    );
  }

  // 2. Create the auth user (role forced to 'vendor' by handle_new_user).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "vendor", name: `${firstName} ${lastName}`.trim(), phone },
  });
  if (createErr || !created?.user) {
    const msg = /already been registered|already exists/i.test(createErr?.message ?? "")
      ? "Un compte existe déjà avec cette adresse e-mail. Connectez-vous."
      : "Impossible de créer le compte. Réessayez.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const userId = created.user.id;

  // 3. Create the store. Its insert trigger creates a trial_pending subscription.
  const slug = `${slugify(storeName)}-${userId.slice(0, 6)}`;
  const { data: store, error: storeErr } = await admin
    .from("stores")
    .insert({ owner_id: userId, name: storeName, slug, phone, status: "pending" })
    .select("id")
    .single();
  if (storeErr || !store) {
    // Roll back the account we just made this same request.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return NextResponse.json({ error: "Impossible de créer la boutique. Réessayez." }, { status: 500 });
  }

  // 4. Activate the plan the applicant paid for, dated from now.
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id, duration_days")
    .eq("code", application.plan_code)
    .maybeSingle();
  const durationDays = plan?.duration_days ?? (application.plan_code === "trial" ? 90 : 30);
  const expiry = new Date(Date.now() + durationDays * 86400000).toISOString();

  // Record the payment (the BEFORE-INSERT trigger re-derives amount/kind/period).
  const { data: payment } = await admin
    .from("subscription_payments")
    .insert({ store_id: store.id, plan_id: plan?.id, kind: application.plan_code === "trial" ? "trial" : "pro_subscription", reference: application.reference })
    .select("id")
    .single();
  if (payment) {
    await admin.from("subscription_payments").update({ status: "success", confirmed_at: new Date().toISOString() }).eq("id", payment.id);
  }

  if (application.plan_code === "trial") {
    await admin
      .from("subscriptions")
      .update({ status: "trial_active", plan_id: plan?.id, trial_activated_at: new Date().toISOString(), trial_expires_at: expiry })
      .eq("store_id", store.id);
  } else {
    await admin
      .from("subscriptions")
      .update({ status: "pro_active", plan_id: plan?.id, pro_activated_at: new Date().toISOString(), current_period_end: expiry })
      .eq("store_id", store.id);
  }

  // 5. Burn the code.
  await admin
    .from("vendor_applications")
    .update({ status: "consumed", store_id: store.id, consumed_at: new Date().toISOString() })
    .eq("id", application.id);

  await admin.from("audit_logs").insert({
    actor_id: null,
    action: "vendor_application.consumed",
    entity_type: "vendor_applications",
    entity_id: application.id,
    metadata: { store_id: store.id, user_id: userId, plan_code: application.plan_code },
  });

  return NextResponse.json({ ok: true });
}
