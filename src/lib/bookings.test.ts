import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES, HOLDS_STOCK, NEXT_STATUSES, staffActions } from "./bookings";

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
    expect(staffActions("CONFIRMED")).toEqual(["CHECKED_OUT", "CANCELLED"]);
    expect(staffActions("CLOSED")).toEqual([]);
  });
});
