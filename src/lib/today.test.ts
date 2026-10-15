import { describe, expect, it } from "vitest";
import type { BookingStatus } from "./bookings";
import { namibiaToday } from "./dates";
import { isLatePickup, isTodayFilter, matchesToday } from "./today";

const TODAY = "2026-10-15";
const booking = (status: BookingStatus, start_date: string, end_date: string) => ({ status, start_date, end_date });

describe("today in Namibia (Africa/Windhoek, UTC+2)", () => {
  it("still counts 23:59 in Windhoek as today", () => {
    expect(namibiaToday(new Date("2026-10-15T21:59:00Z"))).toBe("2026-10-15");
  });

  it("moves to the next day at midnight in Windhoek, not at midnight UTC", () => {
    expect(namibiaToday(new Date("2026-10-15T22:00:00Z"))).toBe("2026-10-16");
    expect(namibiaToday(new Date("2026-10-15T23:30:00Z"))).toBe("2026-10-16");
  });
});

describe("going out today", () => {
  it("includes bookings holding stock that start today", () => {
    for (const status of ["ACCEPTED", "FEE_PENDING", "CONFIRMED"] as const) {
      expect(matchesToday("out-today", booking(status, TODAY, "2026-10-16"), 0, TODAY)).toBe(true);
    }
  });

  it("keeps a missed pickup on the card until it is collected or cancelled", () => {
    expect(matchesToday("out-today", booking("CONFIRMED", "2026-10-14", "2026-10-16"), 0, TODAY)).toBe(true);
  });

  it("leaves out bookings starting tomorrow, requests and items already out", () => {
    expect(matchesToday("out-today", booking("CONFIRMED", "2026-10-16", "2026-10-17"), 0, TODAY)).toBe(false);
    expect(matchesToday("out-today", booking("REQUESTED", TODAY, TODAY), 0, TODAY)).toBe(false);
    expect(matchesToday("out-today", booking("CHECKED_OUT", TODAY, TODAY), 0, TODAY)).toBe(false);
  });
});

describe("late pickups", () => {
  it("flags bookings whose start date has passed but which are not out yet", () => {
    expect(isLatePickup(booking("CONFIRMED", "2026-10-14", "2026-10-16"), TODAY)).toBe(true);
    expect(isLatePickup(booking("ACCEPTED", "2026-10-10", "2026-10-11"), TODAY)).toBe(true);
  });

  it("does not flag bookings starting today, already out or never accepted", () => {
    expect(isLatePickup(booking("CONFIRMED", TODAY, "2026-10-16"), TODAY)).toBe(false);
    expect(isLatePickup(booking("CHECKED_OUT", "2026-10-14", "2026-10-16"), TODAY)).toBe(false);
    expect(isLatePickup(booking("REQUESTED", "2026-10-14", "2026-10-16"), TODAY)).toBe(false);
  });
});

describe("coming back today", () => {
  it("includes checked-out bookings due back today", () => {
    expect(matchesToday("back-today", booking("CHECKED_OUT", "2026-10-13", TODAY), 0, TODAY)).toBe(true);
  });

  it("leaves out bookings due back tomorrow or not yet out", () => {
    expect(matchesToday("back-today", booking("CHECKED_OUT", "2026-10-13", "2026-10-16"), 0, TODAY)).toBe(false);
    expect(matchesToday("back-today", booking("CONFIRMED", TODAY, TODAY), 0, TODAY)).toBe(false);
  });
});

describe("overdue", () => {
  it("includes bookings marked overdue and checked-out bookings past their end date", () => {
    expect(matchesToday("overdue", booking("OVERDUE", "2026-10-10", "2026-10-12"), 0, TODAY)).toBe(true);
    expect(matchesToday("overdue", booking("CHECKED_OUT", "2026-10-10", "2026-10-14"), 0, TODAY)).toBe(true);
  });

  it("does not count a booking due back today as overdue yet", () => {
    expect(matchesToday("overdue", booking("CHECKED_OUT", "2026-10-13", TODAY), 0, TODAY)).toBe(false);
  });
});

describe("money still owed", () => {
  it("counts bookings that went ahead with money outstanding", () => {
    expect(matchesToday("owed", booking("CONFIRMED", "2026-10-24", "2026-10-25"), 2400, TODAY)).toBe(true);
    expect(matchesToday("owed", booking("CLOSED", "2026-09-01", "2026-09-02"), 50, TODAY)).toBe(true);
  });

  it("ignores paid bookings and requests that never went ahead", () => {
    expect(matchesToday("owed", booking("CONFIRMED", "2026-10-24", "2026-10-25"), 0, TODAY)).toBe(false);
    expect(matchesToday("owed", booking("REQUESTED", "2026-11-07", "2026-11-07"), 3300, TODAY)).toBe(false);
    expect(matchesToday("owed", booking("CANCELLED", "2026-11-07", "2026-11-07"), 3300, TODAY)).toBe(false);
  });
});

describe("filter names", () => {
  it("accepts only the four card filters", () => {
    expect(isTodayFilter("overdue")).toBe(true);
    expect(isTodayFilter("all")).toBe(false);
    expect(isTodayFilter(undefined)).toBe(false);
  });
});
