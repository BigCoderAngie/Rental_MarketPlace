import { describe, expect, it } from "vitest";
import { signupHref, signupNext } from "./signup-start";

describe("signupNext and signupHref", () => {
  it("reads where to go after sign-up, only on this site", () => {
    expect(signupNext({ next: "/items/1?from=2026-11-14" })).toBe("/items/1?from=2026-11-14");
    expect(signupNext({ next: "//evil.com" })).toBeNull();
    expect(signupNext({})).toBeNull();
  });

  it("keeps next on the next step's address", () => {
    expect(signupHref("/signup/about", null)).toBe("/signup/about");
    expect(signupHref("/signup/about", "/owner/list")).toBe("/signup/about?next=%2Fowner%2Flist");
  });
});
