import { describe, expect, it } from "vitest";
import {
  firstName,
  hasErrors,
  normalizeNamibianMobile,
  safeNextPath,
  validateAboutYou,
  validateAccount,
  validateOwnerTerms,
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

describe("validateAboutYou", () => {
  const good = { town: "Windhoek", terms: true };

  it("blocks sign-up until the terms are ticked", () => {
    expect(validateAboutYou({ ...good, terms: false }).terms).toMatch(/Terms and Conditions/);
    expect(hasErrors(validateAboutYou(good))).toBe(false);
  });

  it("only asks for a known town and the terms", () => {
    expect(Object.keys(validateAboutYou({ ...good, town: "Atlantis" }))).toEqual(["town"]);
  });
});

describe("validateOwnerTerms", () => {
  const good = { ownerKind: "individual", businessName: "", feeAcknowledged: true };

  it("needs the booking fee box", () => {
    expect(Object.keys(validateOwnerTerms({ ...good, feeAcknowledged: false }))).toEqual(["feeAcknowledged"]);
  });

  it("asks hire businesses for their name only", () => {
    expect(hasErrors(validateOwnerTerms(good))).toBe(false);
    expect(validateOwnerTerms({ ...good, ownerKind: "business" }).businessName).toBeDefined();
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
