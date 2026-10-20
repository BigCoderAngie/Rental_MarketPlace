import type { SupabaseClient } from "@supabase/supabase-js";
import { HOLDS_STOCK, isOverdue, wentAhead, type BookingStatus } from "./bookings";
import { readAll, readByIds } from "./batches";
import { namibiaToday, type IsoDate } from "./dates";

// The "Today" cards at the top of the calendar, and the matching filters on
// the bookings list. Both use loadToday, so a card's count and its list
// always agree. "Today" is the date in Namibia (Africa/Windhoek).

export const TODAY_FILTERS = ["out-today", "back-today", "overdue", "owed"] as const;
export type TodayFilter = (typeof TODAY_FILTERS)[number];

export const TODAY_LABEL: Record<TodayFilter, string> = {
  "out-today": "Going out today",
  "back-today": "Coming back today",
  overdue: "Overdue",
  owed: "Money still owed",
};

export function isTodayFilter(value: unknown): value is TodayFilter {
  return typeof value === "string" && (TODAY_FILTERS as readonly string[]).includes(value);
}

/** Holding stock but not handed over yet. Due out today, or missed and still waiting to be collected. */
const NOT_OUT_YET: readonly BookingStatus[] = HOLDS_STOCK.filter((s) => s !== "CHECKED_OUT" && s !== "OVERDUE");

/** The statuses the first three cards can match (money owed is looked up separately). */
const ACTIVE: readonly BookingStatus[] = [...NOT_OUT_YET, "CHECKED_OUT", "OVERDUE"];

type BookingDates = { status: BookingStatus; start_date: IsoDate; end_date: IsoDate };

/** Should have been collected already: its start date has passed but the items haven't gone out. */
export function isLatePickup(booking: BookingDates, today: IsoDate): boolean {
  return NOT_OUT_YET.includes(booking.status) && booking.start_date < today;
}

/** Whether a booking belongs on a card. `outstanding` is what the customer still owes. */
export function matchesToday(filter: TodayFilter, booking: BookingDates, outstanding: number, today: IsoDate): boolean {
  switch (filter) {
    case "out-today":
      return NOT_OUT_YET.includes(booking.status) && booking.start_date <= today;
    case "back-today":
      return booking.status === "CHECKED_OUT" && booking.end_date === today;
    case "overdue":
      return isOverdue(booking.status, booking.end_date, today);
    case "owed":
      return wentAhead(booking.status) && outstanding > 0;
  }
}

export type TodaySummary = {
  today: IsoDate;
  ids: Record<TodayFilter, string[]>;
  /** How many of the "Going out today" bookings are late pickups. */
  latePickups: number;
  owedTotal: number;
};

/** Counts for the Today cards: the matching booking ids per card, and the total still owed. */
export async function loadToday(supabase: SupabaseClient, businessId: string, now: Date = new Date()): Promise<TodaySummary> {
  const today = namibiaToday(now);

  // Both lists grow with the business's history, so read every page (see batches.ts).
  const [active, owing] = await Promise.all([
    readAll((from, to) =>
      supabase
        .from("bookings")
        .select("id, status, start_date, end_date")
        .eq("business_id", businessId)
        .in("status", ACTIVE)
        .order("id")
        .range(from, to)
        .returns<(BookingDates & { id: string })[]>(),
    ),
    readAll((from, to) =>
      supabase
        .from("booking_balances")
        .select("booking_id, outstanding")
        .eq("business_id", businessId)
        .gt("outstanding", 0)
        .order("booking_id")
        .range(from, to)
        .returns<{ booking_id: string; outstanding: number }[]>(),
    ),
  ]);

  // Money owed counts only bookings that went ahead, whatever their status now.
  const owingBookings = await readByIds(
    owing.map((o) => o.booking_id),
    (ids) => supabase.from("bookings").select("id, status, start_date, end_date").in("id", ids).returns<(BookingDates & { id: string })[]>(),
  );
  const bookingById = new Map(owingBookings.map((b) => [b.id, b]));
  const owed = owing.filter((o) => {
    const booking = bookingById.get(o.booking_id);
    return booking != null && matchesToday("owed", booking, Number(o.outstanding), today);
  });

  const activeIds = (filter: TodayFilter) =>
    active.filter((b) => matchesToday(filter, b, 0, today)).map((b) => b.id);

  return {
    today,
    ids: {
      "out-today": activeIds("out-today"),
      "back-today": activeIds("back-today"),
      overdue: activeIds("overdue"),
      owed: owed.map((o) => o.booking_id),
    },
    latePickups: active.filter((b) => isLatePickup(b, today)).length,
    owedTotal: owed.reduce((sum, o) => sum + Number(o.outstanding), 0),
  };
}
