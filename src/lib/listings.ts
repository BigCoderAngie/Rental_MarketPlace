import type { SupabaseClient } from "@supabase/supabase-js";
import { availabilityLine, type ExploreFilters, ANYWHERE } from "./explore";
import { itemPhotoUrl } from "./item-photos";
import { CATEGORIES } from "./site-links";
import type { ListingCardData } from "./types";

/** One result from search_listings (supabase/migrations/20261023020000_explore_search.sql). */
export type ListingRow = {
  id: string;
  name: string;
  category: string;
  category_name: string;
  daily_price: number;
  deposit: number;
  photo_path: string | null;
  town: string | null;
  free_units: number | null;
};

export type ListingResult = ListingCardData & { id: string };

/** The short category label the kit uses on cards ("Building", "Camping"). */
export function categoryLabel(slug: string, fallback: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? fallback;
}

export function toCard(row: ListingRow, supabase: SupabaseClient, searched: { from: string; to: string } | null): ListingResult {
  const line = availabilityLine(row.free_units, searched);
  return {
    id: row.id,
    title: row.name,
    category: categoryLabel(row.category, row.category_name),
    area: row.town ?? "Namibia",
    price: Number(row.daily_price),
    unit: "day",
    availability: line.text,
    availableNow: line.free,
    photoUrl: itemPhotoUrl(supabase, row.photo_path),
  };
}

/**
 * Runs the Explore search. With dates, only items free on every day are
 * returned (FR-SR-01); without, each card reports on the coming weekend.
 */
export async function searchListings(
  supabase: SupabaseClient,
  filters: ExploreFilters,
  weekend: { from: string; to: string },
): Promise<{ total: number; items: ListingResult[] }> {
  const searched = filters.from && filters.to ? { from: filters.from, to: filters.to } : null;
  const window = searched ?? weekend;
  const { data, error } = await supabase.rpc("search_listings", {
    p_q: filters.q || null,
    p_town: filters.town === ANYWHERE ? null : filters.town,
    p_from: window.from,
    p_to: window.to,
    p_category: filters.cat,
    p_max_price: filters.max,
    p_only_free: Boolean(searched),
    p_sort: filters.sort,
    p_limit: filters.limit,
    p_offset: 0,
  });
  if (error) throw error;
  const result = data as { total: number; items: ListingRow[] };
  return { total: result.total, items: result.items.map((row) => toCard(row, supabase, searched)) };
}

/** Whether anyone has listed anything public yet; until then Explore shows marked samples. */
export async function marketplaceHasListings(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("search_listings", { p_town: null, p_limit: 1 });
  if (error) throw error;
  return (data as { total: number }).total > 0;
}
