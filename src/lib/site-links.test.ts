import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryHref, displayName, initials, searchHref } from "./site-links";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Tangeni Amupolo")).toBe("TA");
    expect(initials("  ndapewa  ")).toBe("N");
    expect(initials("Anna Maria Shikongo")).toBe("AM");
  });

  it("shows a question mark when there is no name", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("displayName", () => {
  it("uses the first name when there is one", () => {
    expect(displayName("Tangeni Amupolo", "t@example.com")).toBe("Tangeni");
  });

  it("falls back to the email before the @, then to You", () => {
    expect(displayName("  ", "tangeni@example.com")).toBe("tangeni");
    expect(displayName(null, null)).toBe("You");
  });
});

describe("links", () => {
  it("builds explore links with safe query values", () => {
    expect(searchHref("PA speakers & lights")).toBe("/explore?q=PA%20speakers%20%26%20lights");
    expect(categoryHref("camping-outdoor")).toBe("/explore?cat=camping-outdoor");
  });

  it("only offers the launch categories", () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(slugs).not.toContain("vehicles");
    expect(slugs).toEqual(["events", "tools", "construction-machinery", "electronics", "camping-outdoor", "other"]);
  });
});
