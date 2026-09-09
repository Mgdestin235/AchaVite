import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { listActiveSubscriptions, setSubscriptionStatus } from "@/lib/db/subscriptions";
import { logAudit } from "@/lib/db/auditLogs";
import { getActivePlan } from "@/lib/db/subscriptionPlans";
import { formatFCFA } from "@/lib/format";
import { buildReminderMessage, decideSubscriptionAction, reminderKindFor } from "@/lib/payments/subscriptionLifecycle";

/**
 * Daily cron (see vercel.json, 07:00 UTC). Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` for scheduled invocations once the
 * CRON_SECRET env var is set on the project -- we just verify it matches.
 *
 * All the "what should happen to this subscription" branching lives in
 * decideSubscriptionAction() (src/lib/payments/subscriptionLifecycle.ts),
 * fully unit-tested. This route is just the I/O shell: run that decision
 * for every trial_active/pro_active subscription, then execute whichever
 * of the two possible actions it returns.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const subscriptions = await listActiveSubscriptions(supabase);
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;

  // The PRO price is always read live from subscription_plans, never
  // hardcoded in a reminder message -- same rule as the pricing cards.
  const proPlan = await getActivePlan(supabase, "pro_monthly");
  const proPriceLabel = proPlan ? `${formatFCFA(Number(proPlan.price))}/mois` : "un tarif visible dans votre espace vendeur";

  let expiredCount = 0;
  let reminderCount = 0;

  for (const sub of subscriptions) {
    const action = decideSubscriptionAction(sub);
    if (action.type === "noop") continue;

    const { data: store } = await supabase.from("stores").select("owner_id, name").eq("id", sub.store_id).maybeSingle();
    if (!store) continue;

    const kind = reminderKindFor(sub);

    if (action.type === "expire") {
      const { error } = await setSubscriptionStatus(supabase, sub.id, action.newStatus);
      if (error) continue;
      expiredCount++;

      await logAudit(supabase, {
        actorId: null,
        action: "subscription.auto_expired",
        entityType: "subscription",
        entityId: sub.id,
        metadata: { from: sub.status, to: action.newStatus },
      });

      // Semantically identical to hitting the J-0 milestone, so reuse the
      // same wording rather than maintaining a second "expired" message.
      const { title, message } = buildReminderMessage(kind, 0, proPriceLabel);
      await supabase.from("notifications").insert({
        user_id: store.owner_id,
        title,
        message,
        kind: "subscription_expired",
        metadata: { subscription_id: sub.id },
      });
      await sendReminderEmail(resend, supabase, store.owner_id, title, message);
      continue;
    }

    // action.type === "remind"
    const { title, message } = buildReminderMessage(kind, action.milestone, proPriceLabel);
    await supabase.from("notifications").insert({
      user_id: store.owner_id,
      title,
      message,
      kind: "subscription_reminder",
      metadata: { subscription_id: sub.id, days_remaining: action.milestone },
    });
    await sendReminderEmail(resend, supabase, store.owner_id, title, message);
    await supabase.from("subscriptions").update({ last_reminder_sent_days: action.milestone }).eq("id", sub.id);
    reminderCount++;
  }

  return NextResponse.json({ ok: true, checked: subscriptions.length, expired: expiredCount, remindersSent: reminderCount });
}

/** Best-effort: email delivery never fails the cron run, and silently no-ops if RESEND_API_KEY isn't set. */
async function sendReminderEmail(
  resend: Resend | null,
  adminSupabase: ReturnType<typeof createAdminClient>,
  ownerId: string,
  subject: string,
  message: string
): Promise<void> {
  if (!resend) return;
  try {
    const { data } = await adminSupabase.auth.admin.getUserById(ownerId);
    const email = data?.user?.email;
    if (!email) return;
    await resend.emails.send({
      from: "AchaVite <onboarding@resend.dev>",
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#0B1F3A;">${subject}</h2>
          <p>${message}</p>
          <p style="color:#888; font-size:12px;">AchaVite — Les meilleures bonnes affaires à portée de main.</p>
        </div>
      `,
    });
  } catch {
    // Never let email failure break the cron run.
  }
}
