import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

type Body = {
  planCode?: string;
  accessCode?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FAILURE_MSG = "Le paiement n'a pas été confirmé. Aucun compte vendeur n'a été créé. Vous pouvez réessayer.";

/**
 * The only way a vendor account gets created. Whether payment is required
 * is decided here, server-side, from the live subscription_plans.is_active
 * flag for the chosen plan -- never from anything the client claims. This
 * is a Super Admin-configurable switch (Monétisation > Plans):
 *   is_active = true  -> a confirmed, unconsumed vendor_applications code
 *                        for this exact plan + email is required.
 *   is_active = false -> the plan is free; the account is created directly.
 * Everything runs with the service-role client so neither path can be
 * bypassed from the browser -- hitting this URL with a fabricated
 * "no payment needed" claim does nothing once the plan is actually paid.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as Body;
  const planCode = (body.planCode ?? "").trim();
  const accessCode = (body.accessCode ?? "").trim().toUpperCase();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const storeName = (body.storeName ?? "").trim();

  if (planCode !== "trial" && planCode !== "pro_monthly") {
    return NextResponse.json({ error: "Offre invalide." }, { status: 400 });
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

  // 0. The plan's live is_active flag is the single source of truth for
  // whether payment is required -- re-read here, not trusted from the
  // request even if the client also checked it for UX.
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id, code, is_active, duration_days")
    .eq("code", planCode)
    .maybeSingle();
  if (!plan) {
    return NextResponse.json({ error: "Offre introuvable." }, { status: 400 });
  }

  let application: { id: string; reference: string | null } | null = null;

  if (plan.is_active) {
    // Paid path: a confirmed, unconsumed application for this exact plan
    // and email must exist. Clicking "Payer" or declaring a payment is
    // never itself treated as success -- only a Super Admin marking the
    // application 'confirmed' does that (see confirmVendorApplication()).
    if (!accessCode) {
      return NextResponse.json({ error: FAILURE_MSG }, { status: 403 });
    }
    const { data: found } = await admin
      .from("vendor_applications")
      .select("*")
      .eq("access_code", accessCode)
      .eq("status", "confirmed")
      .maybeSingle();

    if (!found || found.plan_code !== planCode) {
      return NextResponse.json({ error: FAILURE_MSG }, { status: 403 });
    }
    if (found.email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Cette adresse e-mail ne correspond pas à celle utilisée lors du paiement." },
        { status: 403 }
      );
    }
    application = found;
  }
  // plan.is_active === false: free plan, no application/payment needed at all.

  // 1. Create the auth user (role forced to 'vendor' by handle_new_user).
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

  // 2. Create the store. Its insert trigger creates a trial_pending subscription.
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

  // 3. Activate the plan, dated from now.
  const durationDays = plan.duration_days ?? (planCode === "trial" ? 90 : 30);
  const expiry = new Date(Date.now() + durationDays * 86400000).toISOString();

  if (application) {
    // Paid: record the real payment (the BEFORE-INSERT trigger re-derives
    // amount/kind/period from the plan) and burn the code.
    const { data: payment } = await admin
      .from("subscription_payments")
      .insert({ store_id: store.id, plan_id: plan.id, kind: planCode === "trial" ? "trial" : "pro_subscription", reference: application.reference })
      .select("id")
      .single();
    if (payment) {
      await admin.from("subscription_payments").update({ status: "success", confirmed_at: new Date().toISOString() }).eq("id", payment.id);
    }
    await admin
      .from("vendor_applications")
      .update({ status: "consumed", store_id: store.id, consumed_at: new Date().toISOString() })
      .eq("id", application.id);
    await admin.from("audit_logs").insert({
      actor_id: null,
      action: "vendor_application.consumed",
      entity_type: "vendor_applications",
      entity_id: application.id,
      metadata: { store_id: store.id, user_id: userId, plan_code: planCode },
    });
  } else {
    // Free plan: no payment record (none occurred) -- just an audit trail
    // of the fact that the plan was open/free at signup time.
    await admin.from("audit_logs").insert({
      actor_id: null,
      action: "vendor_signup.free_plan",
      entity_type: "subscriptions",
      entity_id: null,
      metadata: { store_id: store.id, user_id: userId, plan_code: planCode },
    });
  }

  if (planCode === "trial") {
    await admin
      .from("subscriptions")
      .update({ status: "trial_active", plan_id: plan.id, trial_activated_at: new Date().toISOString(), trial_expires_at: expiry })
      .eq("store_id", store.id);
  } else {
    await admin
      .from("subscriptions")
      .update({ status: "pro_active", plan_id: plan.id, pro_activated_at: new Date().toISOString(), current_period_end: expiry })
      .eq("store_id", store.id);
  }

  return NextResponse.json({ ok: true });
}
