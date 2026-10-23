// Owner requests (build kit Part 8, SiteRequests.html, rules 10 to 15):
// waiting requests for an item grouped by clashing dates, with a Best match.

import type { IsoDate } from "./dates";
import type { RequestStatus } from "./requests";

export type OwnerRequest = {
  id: string;
  item_id: string;
  item_name: string;
  photo_path: string | null;
  in_service: number;
  label: string;
  renter_rentals: number;
  start_date: IsoDate;
  end_date: IsoDate;
  quantity: number;
  daily_price: number;
  total: number;
  deposit: number;
  fee_rate: number;
  fee_amount: number;
  status: RequestStatus;
  decline_reason: "dates_taken" | "owner" | null;
  expires_at: string;
  created_at: string;
  paid_at: string | null;
  payment_reference: string | null;
  refund_claimed_at: string | null;
  /** Only once paid. */
  renter: { name: string; phone: string | null } | null;
};

export type DateGroup = {
  from: IsoDate;
  to: IsoDate;
  requests: OwnerRequest[];
  /** More units asked for than the owner has: accepting one declines the rest. */
  clash: boolean;
  bestMatchId: string | null;
};

/** Waiting requests whose dates overlap go together (rule 10); each group sorted oldest first. */
export function groupByDates(requests: OwnerRequest[]): DateGroup[] {
  const waiting = requests.filter((r) => r.status === "REQUESTED").sort((a, b) => a.start_date.localeCompare(b.start_date) || a.created_at.localeCompare(b.created_at));
  const groups: DateGroup[] = [];
  for (const r of waiting) {
    const last = groups.at(-1);
    if (last && r.start_date <= last.to) {
      last.requests.push(r);
      if (r.end_date > last.to) last.to = r.end_date;
    } else {
      groups.push({ from: r.start_date, to: r.end_date, requests: [r], clash: false, bestMatchId: null });
    }
  }
  for (const g of groups) {
    const asked = g.requests.reduce((sum, r) => sum + r.quantity, 0);
    g.clash = g.requests.length > 1 && asked > (g.requests[0]?.in_service ?? 1);
    // Rule 15: the renter with the most rentals, only worth showing when there is a choice.
    if (g.requests.length > 1) {
      const best = [...g.requests].sort((a, b) => b.renter_rentals - a.renter_rentals)[0]!;
      g.bestMatchId = best.renter_rentals > 0 ? best.id : null;
    }
  }
  return groups;
}

/** The other waiting renters accepting this one would decline (same dates, not enough units). */
export function wouldDecline(request: OwnerRequest, groups: DateGroup[]): string[] {
  const group = groups.find((g) => g.requests.some((r) => r.id === request.id));
  if (!group?.clash) return [];
  return group.requests.filter((r) => r.id !== request.id).map((r) => r.label);
}

/** Rule 4: a paid booking's fee can be claimed back once, until 30 days after its start date. */
export function canClaimRefund(r: OwnerRequest, today: IsoDate): boolean {
  if (r.status !== "PAID" || r.refund_claimed_at) return false;
  const last = new Date(`${r.start_date}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() + 30);
  return today <= last.toISOString().slice(0, 10);
}

/** Items that have requests, the one with the most waiting first. */
export function itemsWithRequests(requests: OwnerRequest[]): { id: string; name: string; photo_path: string | null; in_service: number; waiting: number }[] {
  const items = new Map<string, { id: string; name: string; photo_path: string | null; in_service: number; waiting: number }>();
  for (const r of requests) {
    const item = items.get(r.item_id) ?? { id: r.item_id, name: r.item_name, photo_path: r.photo_path, in_service: r.in_service, waiting: 0 };
    if (r.status === "REQUESTED") item.waiting += 1;
    items.set(r.item_id, item);
  }
  return [...items.values()].sort((a, b) => b.waiting - a.waiting || a.name.localeCompare(b.name));
}
