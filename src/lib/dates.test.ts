import { describe, expect, it } from "vitest";
import {
  formatDateWithYear,
  formatDays,
  addDays,
  daysInclusive,
  isIsoDate,
  monthGrid,
  monthRange,
  namibiaToday,
  parseMonth,
  shiftMonth,
} from "./dates";

describe("dates", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("counts both ends of a rental", () => {
    expect(daysInclusive("2026-10-10", "2026-10-10")).toBe(1);
    expect(daysInclusive("2026-10-10", "2026-10-12")).toBe(3);
  });

  it("validates dates", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("10/10/2026")).toBe(false);
  });

  it("uses Namibian time for today", () => {
    // 23:30 UTC on 9 Oct is 01:30 on 10 Oct in Windhoek (UTC+2).
    expect(namibiaToday(new Date("2026-10-09T23:30:00Z"))).toBe("2026-10-10");
  });

  it("moves between months", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(monthRange("2028-02")).toEqual({ first: "2028-02-01", last: "2028-02-29" });
    expect(parseMonth("bad", "2026-10-06")).toBe("2026-10");
  });

  it("lays out a month Monday first", () => {
    // 1 October 2026 is a Thursday.
    const weeks = monthGrid("2026-10");
    expect(weeks[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe("formatDays", () => {
  it("uses the singular only for one day", () => {
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(2)).toBe("2 days");
    expect(formatDays(0)).toBe("0 days");
  });
});

describe("formatDateWithYear", () => {
  it("shows day, short month and year", () => {
    expect(formatDateWithYear("2027-03-31")).toBe("31 Mar 2027");
    expect(formatDateWithYear("2026-01-01")).toBe("1 Jan 2026");
  });
});
