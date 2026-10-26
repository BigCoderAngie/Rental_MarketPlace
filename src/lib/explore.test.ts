import { describe, expect, it } from "vitest";
import { ANYWHERE, availabilityLine, exploreHref, formatShortRange, parseExploreParams, upcomingWeekend } from "./explore";

const TODAY = "2026-11-10"; // a Tuesday

describe("parseExploreParams", () => {
  it("uses sensible defaults", () => {
    expect(parseExploreParams({}, TODAY)).toEqual({ q: "", town: "Windhoek", from: null, to: null, cat: null, max: null, sort: "recommended", limit: 12 });
  });

  it("keeps known values and fixes their spelling", () => {
    const f = parseExploreParams({ q: " tent ", town: "walvis bay", cat: "events", max: "500", sort: "price_asc", from: "2026-11-14", to: "2026-11-16" }, TODAY);
    expect(f).toMatchObject({ q: "tent", town: "Walvis Bay", cat: "events", max: 500, sort: "price_asc", from: "2026-11-14", to: "2026-11-16" });
    expect(parseExploreParams({ town: "anywhere" }, TODAY).town).toBe(ANYWHERE);
  });

  it("drops unknown or unsafe values", () => {
    const f = parseExploreParams({ town: "Atlantis", cat: "vehicles", max: "999", sort: "random", limit: "5000" }, TODAY);
    expect(f).toMatchObject({ town: "Windhoek", cat: null, max: null, sort: "recommended", limit: 48 });
  });

  it("treats From alone as one day and drops bad ranges", () => {
    expect(parseExploreParams({ from: "2026-11-14" }, TODAY)).toMatchObject({ from: "2026-11-14", to: "2026-11-14" });
    expect(parseExploreParams({ from: "2026-11-01", to: "2026-11-02" }, TODAY).from).toBeNull(); // past
    expect(parseExploreParams({ from: "2026-11-16", to: "2026-11-14" }, TODAY).from).toBeNull(); // backwards
    expect(parseExploreParams({ from: "2026-11-14", to: "2027-03-01" }, TODAY).from).toBeNull(); // too long
    expect(parseExploreParams({ from: "2026-02-30" }, TODAY).from).toBeNull(); // not a date
  });

  it("rounds Show more to whole pages", () => {
    expect(parseExploreParams({ limit: "24" }, TODAY).limit).toBe(24);
    expect(parseExploreParams({ limit: "13" }, TODAY).limit).toBe(24);
  });
});

describe("exploreHref", () => {
  const base = parseExploreParams({ q: "tent", from: "2026-11-14", to: "2026-11-16", limit: "24" }, TODAY);

  it("keeps the search and leaves defaults out", () => {
    expect(exploreHref(base, { cat: "camping-outdoor" })).toBe("/explore?q=tent&from=2026-11-14&to=2026-11-16&cat=camping-outdoor");
  });

  it("only keeps the page size when Show more changes it", () => {
    expect(exploreHref(base, { limit: 36 })).toContain("limit=36");
    expect(exploreHref(base)).not.toContain("limit");
  });
});

describe("upcomingWeekend", () => {
  it("is the next Friday to Sunday on a weekday", () => {
    expect(upcomingWeekend("2026-11-10")).toEqual({ from: "2026-11-13", to: "2026-11-15" });
  });

  it("starts today on Friday, Saturday or Sunday", () => {
    expect(upcomingWeekend("2026-11-13")).toEqual({ from: "2026-11-13", to: "2026-11-15" });
    expect(upcomingWeekend("2026-11-14")).toEqual({ from: "2026-11-14", to: "2026-11-15" });
    expect(upcomingWeekend("2026-11-15")).toEqual({ from: "2026-11-15", to: "2026-11-15" });
  });
});

describe("formatShortRange and availabilityLine", () => {
  it("writes ranges as on the kit's cards", () => {
    expect(formatShortRange("2026-11-14", "2026-11-16")).toBe("Sat 14 – Mon 16 Nov");
    expect(formatShortRange("2026-11-28", "2026-12-01")).toBe("Sat 28 Nov – Tue 1 Dec");
    expect(formatShortRange("2026-11-14", "2026-11-14")).toBe("Sat 14 Nov");
  });

  it("reports what the calendar says", () => {
    expect(availabilityLine(0, { from: "2026-11-14", to: "2026-11-16" })).toEqual({ text: "Free on Sat 14 – Mon 16 Nov", free: true });
    expect(availabilityLine(2, null)).toEqual({ text: "Free this weekend", free: true });
    expect(availabilityLine(0, null)).toEqual({ text: "Booked this weekend", free: false });
  });
});
