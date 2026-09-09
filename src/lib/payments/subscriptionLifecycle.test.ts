import { describe, expect, it } from "vitest";
import { buildReminderMessage, decideSubscriptionAction, reminderKindFor } from "./subscriptionLifecycle";
import type { Subscription } from "@/lib/db/types";

function baseSubscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: "sub-1",
    store_id: "store-1",
    plan_id: "plan-1",
    status: "trial_active",
    trial_activated_at: "2026-01-01T00:00:00Z",
    trial_expires_at: null,
    pro_activated_at: null,
    current_period_end: null,
    cancel_at_period_end: false,
    last_reminder_sent_days: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("decideSubscriptionAction", () => {
  const now = new Date("2026-01-10T00:00:00Z");

  it("activation Free: a freshly-activated trial with 90 days left is a noop (no milestone yet)", () => {
    const sub = baseSubscription({ trial_expires_at: "2026-04-01T00:00:00Z" });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "noop" });
  });

  it("fires a reminder exactly at J-7", () => {
    const sub = baseSubscription({ trial_expires_at: "2026-01-17T00:00:00Z" });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "remind", milestone: 7 });
  });

  it("fires a reminder exactly at J-3, J-1 and J-0", () => {
    expect(decideSubscriptionAction(baseSubscription({ trial_expires_at: "2026-01-13T00:00:00Z" }), now)).toEqual({ type: "remind", milestone: 3 });
    expect(decideSubscriptionAction(baseSubscription({ trial_expires_at: "2026-01-11T00:00:00Z" }), now)).toEqual({ type: "remind", milestone: 1 });
    expect(decideSubscriptionAction(baseSubscription({ trial_expires_at: "2026-01-10T00:00:00Z" }), now)).toEqual({ type: "remind", milestone: 0 });
  });

  it("absence de doublons: does not re-remind the same milestone twice", () => {
    const sub = baseSubscription({ trial_expires_at: "2026-01-17T00:00:00Z", last_reminder_sent_days: 7 });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "noop" });
  });

  it("a day that isn't a milestone (and not yet expired) is a noop", () => {
    const sub = baseSubscription({ trial_expires_at: "2026-01-22T00:00:00Z" });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "noop" });
  });

  it("expiration: flips to trial_expired once the date has passed, regardless of last_reminder_sent_days", () => {
    const sub = baseSubscription({ trial_expires_at: "2026-01-05T00:00:00Z", last_reminder_sent_days: 0 });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "expire", newStatus: "trial_expired" });
  });

  it("vendeur déjà PRO: an in-window PRO subscription reminds on its own period_end milestones, not the trial ones", () => {
    const sub = baseSubscription({ status: "pro_active", current_period_end: "2026-01-11T00:00:00Z", trial_expires_at: "2025-01-01T00:00:00Z" });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "remind", milestone: 1 });
  });

  it("vendeur avec paiement échoué: if decideSubscriptionAction were ever called on a payment_failed row (it shouldn't be -- listActiveSubscriptions only returns trial_active/pro_active), it is a noop, never a reminder or a fabricated expiry", () => {
    const sub = baseSubscription({ status: "payment_failed", trial_expires_at: null });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "noop" });
  });

  it("a renewal made before expiry resumes reminders on the new, later period_end", () => {
    // After confirm_subscription_payment() extends current_period_end, the same
    // milestone value (e.g. 0) can legitimately fire again next cycle because
    // last_reminder_sent_days no longer matches the freshly-computed one.
    const sub = baseSubscription({
      status: "pro_active",
      current_period_end: "2026-02-09T00:00:00Z", // ~30 days out again after renewal
      last_reminder_sent_days: 0, // from the previous cycle's expiry reminder
    });
    expect(decideSubscriptionAction(sub, now)).toEqual({ type: "remind", milestone: 30 });
  });
});

describe("reminderKindFor", () => {
  it("is 'trial' for anything except pro_active", () => {
    expect(reminderKindFor({ status: "trial_active" })).toBe("trial");
    expect(reminderKindFor({ status: "trial_pending" })).toBe("trial");
  });

  it("is 'pro' for pro_active", () => {
    expect(reminderKindFor({ status: "pro_active" })).toBe("pro");
  });
});

describe("buildReminderMessage", () => {
  const price = "15 000 FCFA/mois";

  it("uses the exact verbatim trial wording at J-7/J-3/J-1/J0", () => {
    expect(buildReminderMessage("trial", 7, price).message).toBe(
      `Votre période d'essai AchaVite expire dans 7 jours. Passez au Mode Pro à ${price} pour continuer à utiliser votre boutique.`
    );
    expect(buildReminderMessage("trial", 3, price).message).toBe("Votre période d'essai AchaVite expire dans 3 jours.");
    expect(buildReminderMessage("trial", 1, price).message).toBe(
      "Votre période d'essai AchaVite expire demain. Activez le Mode Pro pour conserver votre boutique active."
    );
    expect(buildReminderMessage("trial", 0, price).message).toBe(
      `Votre période d'essai est terminée. Passez au Mode Pro à ${price} pour réactiver votre boutique.`
    );
  });

  it("covers the early trial milestones (30/15) not dictated verbatim, distinct per milestone and non-empty", () => {
    const at30 = buildReminderMessage("trial", 30, price);
    const at15 = buildReminderMessage("trial", 15, price);
    expect(at30.message).toContain("30 jours");
    expect(at15.message).toContain("15 jours");
    expect(at30.message).not.toBe(at15.message);
  });

  it("covers every PRO-renewal milestone (30/15/7/3/1/0), each producing a distinct message", () => {
    const messages = [30, 15, 7, 3, 1, 0].map((m) => buildReminderMessage("pro", m as 30 | 15 | 7 | 3 | 1 | 0, price).message);
    expect(new Set(messages).size).toBe(messages.length);
    for (const message of messages) {
      expect(message.toLowerCase()).toContain("pro");
    }
  });

  it("never hardcodes the PRO price -- it always comes from proPriceLabel", () => {
    const a = buildReminderMessage("trial", 7, "1 FCFA/mois");
    const b = buildReminderMessage("trial", 0, "999 999 FCFA/mois");
    expect(a.message).toContain("1 FCFA/mois");
    expect(b.message).toContain("999 999 FCFA/mois");
  });

  it("uses distinct, non-trial wording for PRO renewal reminders", () => {
    const { message } = buildReminderMessage("pro", 0, price);
    expect(message).not.toContain("essai");
    expect(message).toContain("PRO");
  });
});
