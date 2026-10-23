import { describe, expect, it } from "vitest";
import { signupHref, signupStart } from "./signup-start";

describe("signupStart and signupHref", () => {
  it("reads where someone started, renting by default", () => {
    expect(signupStart({ start: "earn" })).toEqual({ start: "earn", next: null });
    expect(signupStart({ start: "anything", next: "//evil.com" })).toEqual({ start: "rent", next: null });
    expect(signupStart({ next: "/items/1?from=2026-11-14" }).next).toBe("/items/1?from=2026-11-14");
  });

  it("keeps the start and next on the next step's address", () => {
    expect(signupHref("/signup/about", "rent", null)).toBe("/signup/about");
    expect(signupHref("/signup/about", "earn", "/items/1")).toBe("/signup/about?start=earn&next=%2Fitems%2F1");
  });
});
