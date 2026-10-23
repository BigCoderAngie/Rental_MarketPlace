import { describe, expect, it } from "vitest";
import { canClaimRefund, fits, groupByDates, itemsWithRequests, wouldDecline, type OwnerRequest } from "./owner-requests";

const r = (over: Partial<OwnerRequest>): OwnerRequest => ({
  id: "x", item_id: "cam", item_name: "Camera", photo_path: null, in_service: 1, free_units: 1, label: "Renter A", renter_rentals: 0,
  start_date: "2026-11-14", end_date: "2026-11-16", quantity: 1, daily_price: 650, total: 1950, deposit: 5000, fee_rate: 0.1, fee_amount: 195,
  status: "REQUESTED", decline_reason: null, expires_at: "2026-11-11T08:00:00Z", created_at: "2026-11-10T08:00:00Z", paid_at: null,
  payment_reference: null, refund_claimed_at: null, renter: null, ...over,
});

describe("groupByDates", () => {
  const a = r({ id: "a", label: "Renter A", renter_rentals: 23 });
  const b = r({ id: "b", label: "Renter B", created_at: "2026-11-10T09:00:00Z" });
  const c = r({ id: "c", label: "Renter C", start_date: "2026-11-21", end_date: "2026-11-22", renter_rentals: 6 });

  it("puts overlapping dates together and the rest apart, as in the kit", () => {
    const groups = groupByDates([c, b, a]);
    expect(groups.map((g) => [g.from, g.to, g.requests.map((x) => x.id), g.clash])).toEqual([
      ["2026-11-14", "2026-11-16", ["a", "b"], true],
      ["2026-11-21", "2026-11-22", ["c"], false],
    ]);
    expect(groups[0]!.bestMatchId).toBe("a");
    expect(wouldDecline(a, groups)).toEqual(["Renter B"]);
    expect(wouldDecline(c, groups)).toEqual([]);
  });

  it("is no clash when the owner has enough units for everyone", () => {
    expect(groupByDates([r({ id: "a", in_service: 2, free_units: 2 }), r({ id: "b", in_service: 2, free_units: 2 })])[0]!.clash).toBe(false);
  });

  it("only declines the requests that would no longer fit", () => {
    // 3 free: accepting a 1-unit request leaves 2, enough for each of the others.
    const one = r({ id: "one", label: "Renter A", free_units: 3 });
    const two = r({ id: "two", label: "Renter B", free_units: 3, quantity: 2 });
    const three = r({ id: "three", label: "Renter C", free_units: 3, quantity: 2 });
    const groups = groupByDates([one, two, three]);
    expect(wouldDecline(one, groups)).toEqual([]);
    expect(wouldDecline(two, groups)).toEqual(["Renter C"]);
  });

  it("knows when a request no longer fits because of a paid booking", () => {
    expect(fits(r({ free_units: 0 }))).toBe(false);
    expect(fits(r({ free_units: 1 }))).toBe(true);
  });

  it("leaves out requests that are no longer waiting", () => {
    expect(groupByDates([r({ status: "PAID" }), r({ status: "EXPIRED" })])).toEqual([]);
  });
});

describe("canClaimRefund and itemsWithRequests", () => {
  it("allows one claim until 30 days after the start", () => {
    const paid = r({ status: "PAID" });
    expect(canClaimRefund(paid, "2026-12-14")).toBe(true);
    expect(canClaimRefund(paid, "2026-12-15")).toBe(false);
    expect(canClaimRefund({ ...paid, refund_claimed_at: "2026-11-20T00:00:00Z" }, "2026-11-21")).toBe(false);
  });

  it("lists items with the most waiting first", () => {
    const list = itemsWithRequests([r({ item_id: "tent", item_name: "Tent", status: "PAID" }), r({}), r({ id: "y" })]);
    expect(list.map((i) => [i.id, i.waiting])).toEqual([["cam", 2], ["tent", 0]]);
  });
});
