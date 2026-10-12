import { describe, expect, it } from "vitest";
import { effectiveQuoteStatus, quoteMessage, quoteTotals } from "./quotes";

describe("quote totals", () => {
  it("charges every day and applies extras and discount", () => {
    // Matches the database test: (8 x 5 + 800) x 2 days + 150 - 50.
    const t = quoteTotals({
      start_date: "2030-03-10",
      end_date: "2030-03-11",
      delivery_fee: 150,
      setup_fee: 0,
      discount: 50,
      lines: [
        { quantity: 8, daily_price: 5 },
        { quantity: 1, daily_price: 800 },
      ],
    });
    expect(t).toEqual({ days: 2, rental: 1680, total: 1780 });
  });

  it("charges package units at the package price", () => {
    // Matches the database test: (800 package + 20 extra chairs x 5) x 2 days.
    const t = quoteTotals({
      start_date: "2030-05-01",
      end_date: "2030-05-02",
      delivery_fee: 0,
      setup_fee: 0,
      discount: 0,
      lines: [
        { quantity: 120, package_units: 100, daily_price: 5 },
        { quantity: 1, package_units: 1, daily_price: 500 },
      ],
      packages: [{ quantity: 1, daily_price: 800 }],
    });
    expect(t.total).toBe(1800);
  });

  it("never goes below zero", () => {
    const t = quoteTotals({
      start_date: "2030-03-10",
      end_date: "2030-03-10",
      delivery_fee: 0,
      setup_fee: 0,
      discount: 999,
      lines: [{ quantity: 1, daily_price: 10 }],
    });
    expect(t.total).toBe(0);
  });
});

describe("quote status", () => {
  it("shows open quotes past expiry as expired", () => {
    const now = new Date("2030-01-10T12:00:00Z");
    expect(effectiveQuoteStatus("OPEN", "2030-01-10T11:59:00Z", now)).toBe("EXPIRED");
    expect(effectiveQuoteStatus("OPEN", "2030-01-11T00:00:00Z", now)).toBe("OPEN");
    expect(effectiveQuoteStatus("ACCEPTED", "2030-01-01T00:00:00Z", now)).toBe("ACCEPTED");
  });
});

describe("quote message", () => {
  it("greets by first name and carries the link", () => {
    const text = quoteMessage({
      customerName: "Anna Kapuka",
      businessName: "Test Hire",
      reference: "QT-000001",
      start: "2030-03-10",
      end: "2030-03-11",
      total: 1780,
      url: "https://example.com/q/abc",
    });
    expect(text.startsWith("Hi Anna, here is your quote QT-000001 from Test Hire")).toBe(true);
    expect(text).toContain("N$1,780.00");
    expect(text.endsWith("View and accept it here: https://example.com/q/abc")).toBe(true);
  });
});
