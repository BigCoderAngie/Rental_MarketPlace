import { describe, expect, it } from "vitest";
import { conditionLabel, expiresIn, ownerMoney, requestErrorMessage, requestMoney } from "./requests";

describe("requestMoney", () => {
  it("adds rent and deposit, and charges the renter no fee", () => {
    expect(requestMoney(650, 5000, "2026-11-14", "2026-11-16", 1)).toEqual({ days: 3, rent: 1950, deposit: 5000, bookingFee: 0, payOwner: 6950 });
  });

  it("multiplies by the quantity", () => {
    expect(requestMoney(100, 50, "2026-11-14", "2026-11-14", 3)).toMatchObject({ rent: 300, deposit: 150, payOwner: 450 });
  });
});

describe("ownerMoney", () => {
  it("matches the kit's example: 10% of N$1,950", () => {
    expect(ownerMoney(1950, 0.1)).toEqual({ fee: 195, keep: 1755, percent: 10 });
  });
});

describe("expiresIn and labels", () => {
  const now = new Date("2026-11-10T08:00:00Z");
  it("counts hours, then minutes", () => {
    expect(expiresIn("2026-11-11T05:30:00Z", now)).toBe("Expires in 21 h");
    expect(expiresIn("2026-11-10T08:40:00Z", now)).toBe("Expires in 40 min");
    expect(expiresIn("2026-11-10T07:00:00Z", now)).toBe("Expired");
  });

  it("words conditions and stock errors", () => {
    expect(conditionLabel("like_new")).toBe("Like new");
    expect(conditionLabel("broken")).toBeNull();
    expect(requestErrorMessage({ message: 'Not enough "Camera" on 2026-11-14' })).toMatch(/no longer free/);
  });
});
