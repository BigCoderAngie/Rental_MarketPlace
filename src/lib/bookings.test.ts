import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES, HOLDS_STOCK, NEXT_STATUSES, isOverdue, staffActions, wentAhead } from "./bookings";

const migrationsDir = join(__dirname, "../../supabase/migrations");
const sql = readdirSync(migrationsDir)
  .sort()
  .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
  .join("\n");

describe("booking states", () => {
  it("matches the transition rules in the database", () => {
    const body = sql.match(/function public\.booking_transition_allowed[\s\S]*?\$\$([\s\S]*?)\$\$/)![1];
    const fromDb: Record<string, string[]> = {};
    for (const [, from, list] of body.matchAll(/when '(\w+)' then p_to in \(([^)]*)\)/g)) {
      fromDb[from] = [...list.matchAll(/'(\w+)'/g)].map((m) => m[1]);
    }
    for (const status of BOOKING_STATUSES) {
      expect([...NEXT_STATUSES[status]].sort(), status).toEqual((fromDb[status] ?? []).sort());
    }
  });

  it("matches the stock-holding states in the database", () => {
    const body = sql.match(/function public\.booking_holds_stock[\s\S]*?p_status in \(([^)]*)\)/)![1];
    const fromDb = [...body.matchAll(/'(\w+)'/g)].map((m) => m[1]);
    expect([...HOLDS_STOCK].sort()).toEqual(fromDb.sort());
  });

  it("offers staff the Phase 1 moves only", () => {
    expect(staffActions("REQUESTED")).toEqual(["ACCEPTED", "DECLINED"]);
    expect(staffActions("CONFIRMED")).toEqual(["CANCELLED"]);
    expect(staffActions("CHECKED_OUT")).toEqual([]);
    expect(staffActions("RETURNED")).toEqual(["CLOSED", "PROBLEM_OPEN"]);
    expect(staffActions("CLOSED")).toEqual([]);
  });

  it("flags overdue bookings before the nightly job runs", () => {
    expect(isOverdue("CHECKED_OUT", "2030-01-09", "2030-01-10")).toBe(true);
    expect(isOverdue("CHECKED_OUT", "2030-01-10", "2030-01-10")).toBe(false);
    expect(isOverdue("OVERDUE", "2030-01-12", "2030-01-10")).toBe(true);
    expect(isOverdue("CONFIRMED", "2030-01-01", "2030-01-10")).toBe(false);
  });
});

describe("went ahead", () => {
  it("counts accepted bookings, not requests or ones that never happened", () => {
    expect(wentAhead("CONFIRMED")).toBe(true);
    expect(wentAhead("CLOSED")).toBe(true);
    expect(wentAhead("REQUESTED")).toBe(false);
    expect(wentAhead("CANCELLED")).toBe(false);
  });
});
