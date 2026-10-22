// The categories renters browse by, and the links into search (FR-IN-06, FR-SR-01).
// The launch list is MASTER-PLAN.md "Marketplace decisions" 4: no vehicles or
// homes at launch. The database only has events, tools, construction-machinery
// and other so far; electronics and camping-outdoor need a migration first.

import type { Category } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { slug: "events", name: "Events" },
  { slug: "tools", name: "Tools" },
  { slug: "construction-machinery", name: "Construction and Machinery" },
  { slug: "electronics", name: "Electronics" },
  { slug: "camping-outdoor", name: "Camping and Outdoor" },
  { slug: "other", name: "Other" },
];

/** The launch towns (MASTER-PLAN.md decision 5): Windhoek and Erongo. */
export const SEARCH_TOWNS = ["Windhoek", "Swakopmund", "Walvis Bay"];

/** Quick searches under the home page search box. */
export const POPULAR_SEARCHES = ["Camping gear", "Power tools", "Wedding marquees", "Cameras", "Generators"];

/**
 * A link to the search page. Empty values are left out, so a bare search is
 * just /search; text is trimmed and encoded.
 */
export function searchHref(params: { q?: string; category?: string; town?: string; date?: string } = {}): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "town", "date"] as const) {
    const value = params[key]?.trim();
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `/search?${text}` : "/search";
}
