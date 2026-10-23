// The renter's bookings page (build kit Part 7, SiteBookings.html): sorting
// requests into Active, Upcoming and Past, and the Recent activity list.

import type { IsoDate } from "./dates";
import type { RequestStatus } from "./requests";

export type MyRequest = {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  photo_path: string | null;
  area: string | null;
  town: string | null;
  start_date: IsoDate;
  end_date: IsoDate;
  quantity: number;
  total: number;
  deposit: number;
  status: RequestStatus;
  decline_reason: "dates_taken" | "owner" | null;
  expires_at: string;
  created_at: string;
  paid_at: string | null;
  /** Only once the owner has paid the booking fee. */
  owner: { name: string; phone: string | null } | null;
  address: string | null;
};

export const TABS = ["upcoming", "active", "past"] as const;
export type Tab = (typeof TABS)[number];

/**
 * Active: accepted and happening today. Upcoming: accepted and still to come,
 * or still waiting for the owner. Past: finished, declined, cancelled or expired.
 */
export function tabOf(r: MyRequest, today: IsoDate): Tab {
  if (r.status === "PAID") {
    if (r.end_date < today) return "past";
    return r.start_date <= today ? "active" : "upcoming";
  }
  return r.status === "REQUESTED" ? "upcoming" : "past";
}

export function groupByTab(requests: MyRequest[], today: IsoDate): Record<Tab, MyRequest[]> {
  const groups: Record<Tab, MyRequest[]> = { upcoming: [], active: [], past: [] };
  for (const r of requests) groups[tabOf(r, today)].push(r);
  groups.upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date));
  return groups;
}

export type Activity = { at: string; text: string };

/** Newest first: requests sent, accepted, declined and expired. */
export function recentActivity(requests: MyRequest[], limit = 5): Activity[] {
  const events: Activity[] = [];
  for (const r of requests) {
    events.push({ at: r.created_at, text: `You sent a request for the ${r.item_name.toLowerCase()}.` });
    if (r.status === "PAID" && r.paid_at) events.push({ at: r.paid_at, text: `${r.owner?.name ?? "The owner"} accepted your request for the ${r.item_name.toLowerCase()}.` });
    if (r.status === "DECLINED") {
      events.push({ at: r.created_at, text: r.decline_reason === "dates_taken" ? `The ${r.item_name.toLowerCase()} was taken for those dates.` : `The owner declined your request for the ${r.item_name.toLowerCase()}.` });
    }
    if (r.status === "EXPIRED") events.push({ at: r.expires_at, text: `Your request for the ${r.item_name.toLowerCase()} expired without an answer.` });
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
