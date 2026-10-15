import { describe, expect, it } from "vitest";
import { bookingFeeText, planFeatures, planReminder, priceFor, type Plan } from "./plans";

const pro: Plan = {
  code: "pro",
  name: "Pro",
  yearly_price: 299,
  founding_price: 199,
  item_limit: 100,
  user_limit: 3,
  booking_fee_rate: 0.05,
  full_reports: true,
  sort_order: 2,
};

describe("plan price", () => {
  it("charges the founding price during the founding year only", () => {
    expect(priceFor(pro, { founding_until: "2027-10-12" }, "2027-10-12")).toBe(199);
    expect(priceFor(pro, { founding_until: "2027-10-12" }, "2027-10-13")).toBe(299);
    expect(priceFor(pro, { founding_until: null }, "2026-01-01")).toBe(299);
  });
});

describe("plan reminders", () => {
  const now = new Date("2027-01-01T10:00:00Z");
  const ends = (iso: string) => ({ plan_code: "pro" as const, expires_at: iso });

  it("says nothing on Free or long before the end", () => {
    expect(planReminder({ plan_code: "free", expires_at: null }, "Free", now)).toBeNull();
    expect(planReminder(ends("2027-03-01T10:00:00Z"), "Pro", now)).toBeNull();
  });

  it("warns 30, 7 and 1 days before", () => {
    expect(planReminder(ends("2027-01-31T10:00:00Z"), "Pro", now)?.text).toMatch(/^Your Pro plan ends in 30 days/);
    expect(planReminder(ends("2027-01-08T10:00:00Z"), "Pro", now)?.text).toMatch(/ends in 7 days/);
    expect(planReminder(ends("2027-01-08T11:00:00Z"), "Pro", now)?.text).toMatch(/ends in 7 days/);
    expect(planReminder(ends("2027-01-02T09:00:00Z"), "Pro", now)?.text).toMatch(/ends in 1 day \(/);
    expect(planReminder(ends("2027-01-01T12:00:00Z"), "Pro", now)?.text).toMatch(/ends today/);
  });

  it("says the plan ended for a month afterwards", () => {
    expect(planReminder(ends("2026-12-20T10:00:00Z"), "Pro", now)).toMatchObject({ tone: "ended" });
    expect(planReminder(ends("2026-11-01T10:00:00Z"), "Pro", now)).toBeNull();
  });
});

describe("plan features", () => {
  it("lists limits and reports", () => {
    expect(planFeatures({ item_limit: 15, user_limit: 1, full_reports: false })).toEqual([
      "Up to 15 items",
      "Up to 1 user",
      "Money and booking reports",
    ]);
    expect(planFeatures({ item_limit: null, user_limit: null, full_reports: true })).toEqual([
      "Unlimited items",
      "Unlimited users",
      "Full reports and CSV downloads",
    ]);
  });

  it("shows the booking fee as a whole percentage", () => {
    expect(bookingFeeText({ booking_fee_rate: 0.05 })).toBe("Marketplace booking fee 5% when the marketplace opens");
    expect(bookingFeeText({ booking_fee_rate: 0 })).toBe("Marketplace booking fee 0% when the marketplace opens");
  });
});
