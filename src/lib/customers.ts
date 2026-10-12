// Customer list and history (SRS 1.2 "customer history").

export type CustomerSummary = {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  bookings: number;
  all_bookings: number;
  last_booking_date: string | null;
  total_value: number;
  outstanding: number;
  deposit_held: number;
};

/**
 * Turns what staff type in the search box into a safe PostgREST `or` filter
 * on name and phone, or null to show everyone. Characters that PostgREST
 * reads as syntax are dropped.
 */
export function customerSearchFilter(query: unknown): string | null {
  if (typeof query !== "string") return null;
  const term = query.replace(/[,()*%\\:."]/g, " ").replace(/\s+/g, " ").trim();
  if (term === "") return null;
  return `full_name.ilike.*${term}*,phone.ilike.*${term}*`;
}
