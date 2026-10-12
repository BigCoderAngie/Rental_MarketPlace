import { describe, expect, it } from "vitest";
import { periodRange, readPeriod, toCsv } from "./reports";

describe("report periods", () => {
  it("works out the common periods", () => {
    expect(periodRange("this-month", "2030-02-14")).toEqual({ from: "2030-02-01", to: "2030-02-28" });
    expect(periodRange("last-month", "2030-01-14")).toEqual({ from: "2029-12-01", to: "2029-12-31" });
    expect(periodRange("last-30-days", "2030-03-30")).toEqual({ from: "2030-03-01", to: "2030-03-30" });
    expect(periodRange("this-year", "2030-06-01")).toEqual({ from: "2030-01-01", to: "2030-12-31" });
  });

  it("uses chosen dates, else the named period, else this month", () => {
    expect(readPeriod({ from: "2030-04-01", to: "2030-04-10" }, "2030-06-01")).toEqual({
      from: "2030-04-01",
      to: "2030-04-10",
      key: null,
    });
    expect(readPeriod({ period: "last-month" }, "2030-06-01").from).toBe("2030-05-01");
    expect(readPeriod({ from: "nonsense", period: "nope" }, "2030-06-15")).toEqual({
      from: "2030-06-01",
      to: "2030-06-30",
      key: "this-month",
    });
  });
});

describe("csv", () => {
  it("quotes commas and quotes, and defuses formulas", () => {
    expect(toCsv(["Name", "N$"], [["Kapuka, Anna", 10], ['The "Big" Tent', 5], ["=HYPERLINK()", null]])).toBe(
      'Name,N$\r\n"Kapuka, Anna",10\r\n"The ""Big"" Tent",5\r\n\'=HYPERLINK(),\r\n',
    );
  });
});
