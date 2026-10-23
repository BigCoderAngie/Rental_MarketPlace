import { describe, expect, it } from "vitest";
import { groupByTab, recentActivity, tabOf, type MyRequest } from "./my-bookings";

const base: MyRequest = {
  id: "1", item_id: "i", item_name: "Camera", category: "electronics", photo_path: null, area: null, town: "Windhoek",
  start_date: "2026-11-14", end_date: "2026-11-16", quantity: 1, total: 1950, deposit: 5000, status: "REQUESTED",
  decline_reason: null, expires_at: "2026-11-11T08:00:00Z", created_at: "2026-11-10T08:00:00Z", answered_at: null, paid_at: null, owner: null, address: null,
};

describe("tabOf", () => {
  it("puts waiting and future accepted requests in Upcoming", () => {
    expect(tabOf(base, "2026-11-10")).toBe("upcoming");
    expect(tabOf({ ...base, status: "PAID" }, "2026-11-10")).toBe("upcoming");
  });

  it("puts accepted rentals happening today in Active, finished ones in Past", () => {
    expect(tabOf({ ...base, status: "PAID" }, "2026-11-15")).toBe("active");
    expect(tabOf({ ...base, status: "PAID" }, "2026-11-17")).toBe("past");
  });

  it("puts declined, cancelled and expired requests in Past", () => {
    for (const status of ["DECLINED", "CANCELLED", "EXPIRED"] as const) expect(tabOf({ ...base, status }, "2026-11-10")).toBe("past");
  });
});

describe("groupByTab and recentActivity", () => {
  it("sorts upcoming by start date", () => {
    const later = { ...base, id: "2", start_date: "2026-11-20", end_date: "2026-11-21" };
    expect(groupByTab([later, base], "2026-11-10").upcoming.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("lists the newest events first", () => {
    const paid = { ...base, status: "PAID" as const, paid_at: "2026-11-10T10:00:00Z", owner: { name: "Selma", phone: null } };
    expect(recentActivity([paid]).map((a) => a.text)).toEqual(["Selma accepted your request for the camera.", "You sent a request for the camera."]);
  });
});
