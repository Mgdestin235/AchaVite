import type { Subscription, SubscriptionStatus } from "@/lib/db/types";
import { computeSubscriptionStatus, daysUntil, nextReminderDay, type ReminderMilestone } from "./pricing";

/**
 * The "SubscriptionLifecycleService" decision layer: given a subscription
 * and the current time, decide the single action the daily cron should take
 * for it. Pure and DB-free on purpose -- every branch is unit-testable
 * without mocking Supabase, and the cron route (src/app/api/cron/
 * subscription-reminders/route.ts) is reduced to "call this, then perform
 * whatever I/O the result asks for".
 */
export type LifecycleAction =
  | { type: "noop" }
  | { type: "expire"; newStatus: SubscriptionStatus }
  | { type: "remind"; milestone: ReminderMilestone };

export function decideSubscriptionAction(subscription: Subscription, now: Date = new Date()): LifecycleAction {
  const effectiveStatus = computeSubscriptionStatus(subscription, now);
  if (effectiveStatus !== subscription.status) {
    return { type: "expire", newStatus: effectiveStatus };
  }

  const expiry = subscription.status === "pro_active" ? subscription.current_period_end : subscription.trial_expires_at;
  const milestone = nextReminderDay(daysUntil(expiry, now));
  if (milestone === null || milestone === subscription.last_reminder_sent_days) {
    return { type: "noop" };
  }
  return { type: "remind", milestone };
}

export type ReminderKind = "trial" | "pro";

/** Which wording to use depends on whether this is the FREE trial or a PRO renewal. */
export function reminderKindFor(subscription: Pick<Subscription, "status">): ReminderKind {
  return subscription.status === "pro_active" ? "pro" : "trial";
}

/**
 * Builds the notification title/message for a given milestone. The J-7/J-3/
 * J-1/J0 trial wording is verbatim as dictated by the platform owner; the
 * PRO-renewal wording and the 30/15-day early trial reminders (not part of
 * that exact spec) follow the same tone. proPriceLabel is always a live,
 * formatted price (e.g. "15 000 FCFA/mois") -- never hardcoded here.
 */
export function buildReminderMessage(
  kind: ReminderKind,
  milestone: ReminderMilestone,
  proPriceLabel: string
): { title: string; message: string } {
  if (kind === "trial") {
    switch (milestone) {
      case 7:
        return {
          title: "Rappel d'abonnement",
          message: `Votre période d'essai AchaVite expire dans 7 jours. Passez au Mode Pro à ${proPriceLabel} pour continuer à utiliser votre boutique.`,
        };
      case 3:
        return { title: "Rappel d'abonnement", message: "Votre période d'essai AchaVite expire dans 3 jours." };
      case 1:
        return {
          title: "Rappel d'abonnement",
          message: "Votre période d'essai AchaVite expire demain. Activez le Mode Pro pour conserver votre boutique active.",
        };
      case 0:
        return {
          title: "Essai expiré",
          message: `Votre période d'essai est terminée. Passez au Mode Pro à ${proPriceLabel} pour réactiver votre boutique.`,
        };
      default:
        return {
          title: "Rappel d'abonnement",
          message: `Votre période d'essai AchaVite expire dans ${milestone} jours. Pensez à passer au Mode Pro pour continuer à utiliser votre boutique sans interruption.`,
        };
    }
  }

  switch (milestone) {
    case 0:
      return {
        title: "Abonnement PRO expiré",
        message: "Votre abonnement PRO AchaVite est arrivé à expiration. Renouvelez-le pour réactiver votre boutique.",
      };
    case 1:
      return {
        title: "Rappel d'abonnement",
        message: "Votre abonnement PRO AchaVite expire demain. Renouvelez-le pour ne pas perdre l'accès.",
      };
    default:
      return {
        title: "Rappel d'abonnement",
        message: `Votre abonnement PRO AchaVite expire dans ${milestone} jours. Pensez à le renouveler.`,
      };
  }
}
