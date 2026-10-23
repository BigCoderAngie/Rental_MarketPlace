// Explore filters (build kit Part 5, docs/build-kit/reference/desktop/SiteExplore.html):
// everything lives in the address (?q=&town=&from=&to=&cat=&max=&sort=&limit=)
// so a search can be shared, and the page works without JavaScript.

import { addDays, daysInclusive, isIsoDate, type IsoDate } from "./dates";
import { CATEGORIES, SEARCH_TOWNS } from "./site-links";

export const ANYWHERE = "Anywhere";
export const DEFAULT_TOWN = "Windhoek";
export const PRICE_CHIPS = [250, 500, 1000, 2500];
export const PAGE_SIZE = 12;
export const MAX_RESULTS = 48;
export const MAX_RANGE_DAYS = 90;

export const SORTS = {
  recommended: "Recommended",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  newest: "Newest",
} as const;
export type Sort = keyof typeof SORTS;

export type ExploreFilters = {
  q: string;
  /** A launch town, or ANYWHERE. */
  town: string;
  from: IsoDate | null;
  to: IsoDate | null;
  cat: string | null;
  max: number | null;
  sort: Sort;
  limit: number;
};

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Reads the filters from the address, dropping anything that doesn't fit:
 * unknown towns, categories, prices or sorts; dates in the past, the wrong
 * way round or more than 90 days apart. "From" alone means that one day.
 */
export function parseExploreParams(params: Params, today: IsoDate): ExploreFilters {
  const townParam = one(params, "town");
  const town = townParam.toLowerCase() === ANYWHERE.toLowerCase() ? ANYWHERE : (SEARCH_TOWNS.find((t) => t.toLowerCase() === townParam.toLowerCase()) ?? DEFAULT_TOWN);

  let from: IsoDate | null = isIsoDate(one(params, "from")) ? one(params, "from") : null;
  let to: IsoDate | null = isIsoDate(one(params, "to")) ? one(params, "to") : null;
  if (from && !to) to = from;
  if (!from || !to || from < today || to < from || daysInclusive(from, to) > MAX_RANGE_DAYS) {
    from = null;
    to = null;
  }

  const catParam = one(params, "cat");
  const maxParam = Number(one(params, "max"));
  const sortParam = one(params, "sort");
  const limitParam = Number(one(params, "limit"));

  return {
    q: one(params, "q").slice(0, 80),
    town,
    from,
    to,
    cat: CATEGORIES.some((c) => c.slug === catParam) ? catParam : null,
    max: PRICE_CHIPS.includes(maxParam) ? maxParam : null,
    sort: sortParam in SORTS ? (sortParam as Sort) : "recommended",
    limit: Number.isInteger(limitParam) && limitParam > PAGE_SIZE ? Math.min(Math.ceil(limitParam / PAGE_SIZE) * PAGE_SIZE, MAX_RESULTS) : PAGE_SIZE,
  };
}

/**
 * The address for these filters with some changed. Defaults are left out so
 * links stay short; changing anything but "limit" starts again at the first page.
 */
export function exploreHref(filters: ExploreFilters, changes: Partial<ExploreFilters> = {}): string {
  const f = { ...filters, ...changes };
  if (!("limit" in changes)) f.limit = PAGE_SIZE;
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.town !== DEFAULT_TOWN) params.set("town", f.town);
  if (f.from && f.to) {
    params.set("from", f.from);
    params.set("to", f.to);
  }
  if (f.cat) params.set("cat", f.cat);
  if (f.max) params.set("max", String(f.max));
  if (f.sort !== "recommended") params.set("sort", f.sort);
  if (f.limit > PAGE_SIZE) params.set("limit", String(f.limit));
  const query = params.toString();
  return query ? `/explore?${query}` : "/explore";
}

/** Friday to Sunday of this weekend (from today when it is already the weekend), else the next one. */
export function upcomingWeekend(today: IsoDate): { from: IsoDate; to: IsoDate } {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 Sunday … 6 Saturday
  const toSunday = (7 - weekday) % 7;
  if (weekday === 5 || weekday === 6 || weekday === 0) return { from: today, to: addDays(today, toSunday) };
  return { from: addDays(today, (5 - weekday + 7) % 7), to: addDays(today, toSunday) };
}

const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

function parts(date: IsoDate) {
  const d = new Date(`${date}T00:00:00Z`);
  return { day: DAY.format(d), month: MONTH.format(d) };
}

/** "Fri 14 – Sun 16 Nov", "Fri 28 Nov – Sun 1 Dec", or "Sat 15 Nov" for one day, as on the kit's cards. */
export function formatShortRange(from: IsoDate, to: IsoDate): string {
  const a = parts(from);
  const b = parts(to);
  if (from === to) return `${a.day} ${a.month}`;
  return a.month === b.month ? `${a.day} – ${b.day} ${b.month}` : `${a.day} ${a.month} – ${b.day} ${b.month}`;
}

/**
 * The green line on a card, from the item's calendar. With searched dates the
 * results only hold items free then. Without, it reports on this weekend.
 */
export function availabilityLine(freeUnits: number | null, searched: { from: IsoDate; to: IsoDate } | null): { text: string; free: boolean } {
  if (searched) return { text: `Free on ${formatShortRange(searched.from, searched.to)}`, free: true };
  if (freeUnits === null) return { text: "Check dates on the item page", free: false };
  return freeUnits > 0 ? { text: "Free this weekend", free: true } : { text: "Booked this weekend", free: false };
}
