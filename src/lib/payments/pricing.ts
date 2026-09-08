import type { Subscription, SubscriptionStatus } from "@/lib/db/types";

/** Pure, side-effect-free, and deliberately UTC-calendar-day based so results don't drift with DST. */
export function daysUntil(expiryIso: string | null, now: Date = new Date()): number | null {
  if (!expiryIso) return null;
  const expiry = new Date(expiryIso);
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const utcExpiry = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  return Math.round((utcExpiry - utcNow) / 86400000);
}

export const REMINDER_MILESTONES = [30, 15, 7, 3, 1, 0] as const;
export type ReminderMilestone = (typeof REMINDER_MILESTONES)[number];

/**
 * Returns the milestone that exactly matches `daysRemaining`, or null if
 * today isn't one of the 30/15/7/3/1/0 marks. Called once per day (by the
 * reminder cron) against each active subscription.
 */
export function nextReminderDay(daysRemaining: number | null): ReminderMilestone | null {
  if (daysRemaining === null) return null;
  if (daysRemaining <= 0) return 0;
  return REMINDER_MILESTONES.find((m) => m === daysRemaining) ?? null;
}

/**
 * The subscription's effective status right now, independent of whether the
 * daily cron has already run today -- used as a live fallback in the vendor
 * portal's access-control gate so it never depends solely on cron timing.
 */
export function computeSubscriptionStatus(subscription: Subscription | null, now: Date = new Date()): SubscriptionStatus {
  if (!subscription) return "trial_pending";
  if (subscription.status === "suspended" || subscription.status === "cancelled") return subscription.status;

  if (subscription.status === "trial_active" && subscription.trial_expires_at) {
    const remaining = daysUntil(subscription.trial_expires_at, now);
    if (remaining !== null && remaining < 0) return "trial_expired";
  }
  if (subscription.status === "pro_active" && subscription.current_period_end) {
    const remaining = daysUntil(subscription.current_period_end, now);
    if (remaining !== null && remaining < 0) return "pro_expired";
  }
  return subscription.status;
}

/** True for the two statuses that unlock the full vendor portal. */
export function hasActiveAccess(status: SubscriptionStatus): boolean {
  return status === "trial_active" || status === "pro_active";
}
