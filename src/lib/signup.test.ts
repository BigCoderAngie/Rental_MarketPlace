import { describe, expect, it } from "vitest";
import {
  firstName,
  hasErrors,
  normalizeNamibianMobile,
  safeNextPath,
  validateAccount,
  validateOwnerDetails,
  validateRenterDetails,
} from "./signup";

const goodAccount = { fullName: "Tangeni Amupolo", email: "t@example.com", phone: "81 234 5678", password: "longenough", confirm: "longenough" };

describe("normalizeNamibianMobile", () => {
  it("accepts the ways people type a Namibian number", () => {
    expect(normalizeNamibianMobile("81 234 5678")).toBe("+264812345678");
    expect(normalizeNamibianMobile("081-234-5678")).toBe("+264812345678");
    expect(normalizeNamibianMobile("+264 81 234 5678")).toBe("+264812345678");
  });

  it("rejects numbers that are too short or too long", () => {
    expect(normalizeNamibianMobile("81 234")).toBeNull();
    expect(normalizeNamibianMobile("81 234 5678 9")).toBeNull();
    expect(normalizeNamibianMobile("")).toBeNull();
  });
});

describe("validateAccount", () => {
  it("passes a complete account", () => {
    expect(hasErrors(validateAccount(goodAccount))).toBe(false);
  });

  it("explains each missing or wrong field", () => {
    const errors = validateAccount({ fullName: " ", email: "nope", phone: "12", password: "short", confirm: "other" });
    expect(Object.keys(errors).sort()).toEqual(["confirm", "email", "fullName", "password", "phone"]);
    expect(errors.password).toBe("Use at least 8 characters.");
  });
});

describe("validateRenterDetails", () => {
  it("blocks sign-up until the terms are ticked", () => {
    expect(validateRenterDetails({ town: "Windhoek", firstGoal: "rent", terms: false }).terms).toMatch(/Terms and Conditions/);
    expect(hasErrors(validateRenterDetails({ town: "Windhoek", firstGoal: "rent", terms: true }))).toBe(false);
  });

  it("only accepts towns from the list", () => {
    expect(validateRenterDetails({ town: "Atlantis", firstGoal: "earn", terms: true }).town).toBeDefined();
  });
});

describe("validateOwnerDetails", () => {
  const good = { ownerKind: "individual", businessName: "", town: "Rundu", feeAcknowledged: true, terms: true };

  it("needs both the booking fee box and the terms box", () => {
    const errors = validateOwnerDetails({ ...good, feeAcknowledged: false, terms: false });
    expect(Object.keys(errors).sort()).toEqual(["feeAcknowledged", "terms"]);
  });

  it("asks hire businesses for their name only", () => {
    expect(hasErrors(validateOwnerDetails(good))).toBe(false);
    expect(validateOwnerDetails({ ...good, ownerKind: "business" }).businessName).toBeDefined();
  });
});

describe("firstName and safeNextPath", () => {
  it("takes the first word of a name", () => {
    expect(firstName("  Selma Nangolo ")).toBe("Selma");
  });

  it("only allows paths on this site", () => {
    expect(safeNextPath("/welcome")).toBe("/welcome");
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("/\\evil.com")).toBeNull();
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath("/\t/evil.com")).toBeNull();
    expect(safeNextPath("/\n/evil.com")).toBeNull();
    expect(safeNextPath("/my/bookings?tab=past")).toBe("/my/bookings?tab=past");
  });
});
