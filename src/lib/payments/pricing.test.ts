import { describe, expect, it } from "vitest";
import { computeSubscriptionStatus, daysUntil, hasActiveAccess, nextReminderDay } from "./pricing";
import type { Subscription } from "@/lib/db/types";

function baseSubscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: "sub-1",
    store_id: "store-1",
    plan_id: "plan-1",
    status: "trial_pending",
    trial_activated_at: null,
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

describe("daysUntil", () => {
  const now = new Date("2026-01-10T12:00:00Z");

  it("returns null when there is no expiry date", () => {
    expect(daysUntil(null, now)).toBeNull();
  });

  it("counts whole UTC calendar days, ignoring the time of day", () => {
    expect(daysUntil("2026-01-20T00:00:00Z", now)).toBe(10);
    expect(daysUntil("2026-01-20T23:59:59Z", now)).toBe(10);
  });

  it("returns 0 on the expiry day itself", () => {
    expect(daysUntil("2026-01-10T00:00:00Z", now)).toBe(0);
  });

  it("returns a negative number once the expiry date has passed", () => {
    expect(daysUntil("2026-01-01T00:00:00Z", now)).toBe(-9);
  });
});

describe("nextReminderDay", () => {
  it("returns null for a day that isn't one of the milestones", () => {
    expect(nextReminderDay(20)).toBeNull();
    expect(nextReminderDay(29)).toBeNull();
    expect(nextReminderDay(2)).toBeNull();
  });

  it("returns the exact milestone for 30/15/7/3/1", () => {
    expect(nextReminderDay(30)).toBe(30);
    expect(nextReminderDay(15)).toBe(15);
    expect(nextReminderDay(7)).toBe(7);
    expect(nextReminderDay(3)).toBe(3);
    expect(nextReminderDay(1)).toBe(1);
  });

  it("returns 0 on the expiry day and every day after (idempotent 'expired' marker)", () => {
    expect(nextReminderDay(0)).toBe(0);
    expect(nextReminderDay(-1)).toBe(0);
    expect(nextReminderDay(-30)).toBe(0);
  });

  it("returns null when there is no expiry date at all", () => {
    expect(nextReminderDay(null)).toBeNull();
  });
});

describe("computeSubscriptionStatus", () => {
  const now = new Date("2026-01-10T00:00:00Z");

  it("treats a missing subscription as trial_pending", () => {
    expect(computeSubscriptionStatus(null, now)).toBe("trial_pending");
  });

  it("suspended and cancelled always override, regardless of dates", () => {
    expect(computeSubscriptionStatus(baseSubscription({ status: "suspended", trial_expires_at: "2027-01-01T00:00:00Z" }), now)).toBe("suspended");
    expect(computeSubscriptionStatus(baseSubscription({ status: "cancelled", current_period_end: "2027-01-01T00:00:00Z" }), now)).toBe("cancelled");
  });

  it("trial_active becomes trial_expired once trial_expires_at has passed", () => {
    const sub = baseSubscription({ status: "trial_active", trial_expires_at: "2026-01-01T00:00:00Z" });
    expect(computeSubscriptionStatus(sub, now)).toBe("trial_expired");
  });

  it("trial_active stays trial_active while still within the window", () => {
    const sub = baseSubscription({ status: "trial_active", trial_expires_at: "2026-02-01T00:00:00Z" });
    expect(computeSubscriptionStatus(sub, now)).toBe("trial_active");
  });

  it("pro_active becomes pro_expired once current_period_end has passed", () => {
    const sub = baseSubscription({ status: "pro_active", current_period_end: "2026-01-01T00:00:00Z" });
    expect(computeSubscriptionStatus(sub, now)).toBe("pro_expired");
  });

  it("pro_active stays pro_active while still within the period", () => {
    const sub = baseSubscription({ status: "pro_active", current_period_end: "2026-02-01T00:00:00Z" });
    expect(computeSubscriptionStatus(sub, now)).toBe("pro_active");
  });

  it("passes through trial_pending/trial_expired/pro_expired/payment_pending/payment_failed unchanged", () => {
    for (const status of ["trial_pending", "trial_expired", "pro_expired", "payment_pending", "payment_failed"] as const) {
      expect(computeSubscriptionStatus(baseSubscription({ status }), now)).toBe(status);
    }
  });
});

describe("hasActiveAccess", () => {
  it("is true only for trial_active and pro_active", () => {
    expect(hasActiveAccess("trial_active")).toBe(true);
    expect(hasActiveAccess("pro_active")).toBe(true);
    for (const status of ["trial_pending", "trial_expired", "pro_expired", "payment_pending", "payment_failed", "suspended", "cancelled"] as const) {
      expect(hasActiveAccess(status)).toBe(false);
    }
  });
});
