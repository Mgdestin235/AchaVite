import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { listActiveSubscriptions, setSubscriptionStatus } from "@/lib/db/subscriptions";
import { logAudit } from "@/lib/db/auditLogs";
import { computeSubscriptionStatus, daysUntil, nextReminderDay } from "@/lib/payments/pricing";

/**
 * Daily cron (see vercel.json, 07:00 UTC). Vercel automatically sends
 * `Authorization: Bearer <CRON_SECRET>` for scheduled invocations once the
 * CRON_SECRET env var is set on the project -- we just verify it matches.
 *
 * Two jobs in one pass over every trial_active/pro_active subscription:
 *  1. flip truly-expired ones to trial_expired/pro_expired (server-derived,
 *     never trusts the client) and notify the vendor once.
 *  2. for the rest, fire a reminder at the 30/15/7/3/1/0-day marks,
 *     deduplicated via subscriptions.last_reminder_sent_days so a given
 *     milestone is never notified twice even if the cron reruns same-day.
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

  let expiredCount = 0;
  let reminderCount = 0;

  for (const sub of subscriptions) {
    const effectiveStatus = computeSubscriptionStatus(sub);

    if (effectiveStatus !== sub.status) {
      const { error } = await setSubscriptionStatus(supabase, sub.id, effectiveStatus);
      if (error) continue;
      expiredCount++;

      await logAudit(supabase, {
        actorId: null,
        action: "subscription.auto_expired",
        entityType: "subscription",
        entityId: sub.id,
        metadata: { from: sub.status, to: effectiveStatus },
      });

      const { data: store } = await supabase.from("stores").select("owner_id, name").eq("id", sub.store_id).maybeSingle();
      if (store) {
        await supabase.from("notifications").insert({
          user_id: store.owner_id,
          title: "Abonnement expiré",
          message: `L'abonnement de votre boutique "${store.name}" a expiré. Renouvelez pour retrouver l'accès complet à votre espace vendeur.`,
          kind: "subscription_expired",
          metadata: { subscription_id: sub.id },
        });
        await sendReminderEmail(resend, supabase, store.owner_id, "Abonnement expiré", `L'abonnement de votre boutique "${store.name}" a expiré. Renouvelez pour retrouver l'accès complet.`);
      }
      continue;
    }

    const expiry = sub.status === "pro_active" ? sub.current_period_end : sub.trial_expires_at;
    const remaining = daysUntil(expiry);
    const milestone = nextReminderDay(remaining);
    if (milestone === null || milestone === sub.last_reminder_sent_days) continue;

    const { data: store } = await supabase.from("stores").select("owner_id, name").eq("id", sub.store_id).maybeSingle();
    if (!store) continue;

    const label = milestone === 0 ? "expire aujourd'hui" : `expire dans ${milestone} jour${milestone > 1 ? "s" : ""}`;
    const message = `L'abonnement de votre boutique "${store.name}" ${label}.`;

    await supabase.from("notifications").insert({
      user_id: store.owner_id,
      title: "Rappel d'abonnement",
      message,
      kind: "subscription_reminder",
      metadata: { subscription_id: sub.id, days_remaining: milestone },
    });
    await sendReminderEmail(resend, supabase, store.owner_id, "Rappel d'abonnement AchaVite", message);
    await supabase.from("subscriptions").update({ last_reminder_sent_days: milestone }).eq("id", sub.id);
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
