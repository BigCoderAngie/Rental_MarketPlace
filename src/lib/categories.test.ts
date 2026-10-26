import { describe, expect, it } from "vitest";
import { CATEGORIES, POPULAR_SEARCHES, SEARCH_TOWNS, searchHref } from "./categories";

describe("launch categories", () => {
  it("are the six agreed categories, in order", () => {
    expect(CATEGORIES.map((c) => c.slug)).toEqual([
      "events",
      "tools",
      "construction-machinery",
      "electronics",
      "camping-outdoor",
      "other",
    ]);
  });

  it("leave out vehicles and homes", () => {
    const words = CATEGORIES.map((c) => `${c.slug} ${c.name}`.toLowerCase()).join(" ");
    const vehiclesOrHomes = /\b(vehicles?|cars?|bakkies?|homes?|rooms?|houses?|flats?)\b/;
    expect(words).not.toMatch(vehiclesOrHomes);
    expect(POPULAR_SEARCHES.join(" ").toLowerCase()).not.toMatch(vehiclesOrHomes);
  });

  it("have unique slugs that fit in a URL", () => {
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length);
    for (const { slug } of CATEGORIES) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("search the launch towns", () => {
    expect(SEARCH_TOWNS).toEqual(["Windhoek", "Swakopmund", "Walvis Bay"]);
  });
});

describe("searchHref", () => {
  it("is the bare search page with nothing to search for", () => {
    expect(searchHref()).toBe("/search");
    expect(searchHref({ q: "  ", town: "" })).toBe("/search");
  });

  it("links a category", () => {
    expect(searchHref({ category: "camping-outdoor" })).toBe("/search?category=camping-outdoor");
  });

  it("trims and encodes text, in a fixed order", () => {
    expect(searchHref({ date: "2026-11-14", town: "Walvis Bay", q: " Tent & chairs " })).toBe(
      "/search?q=Tent+%26+chairs&town=Walvis+Bay&date=2026-11-14",
    );
  });
});
