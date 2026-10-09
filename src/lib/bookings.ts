// Booking states from SRS section 4.2. The database enforces these rules
// (see supabase/migrations); this copy only decides which buttons to show.

export const BOOKING_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "FEE_PENDING",
  "CONFIRMED",
  "CHECKED_OUT",
  "OVERDUE",
  "RETURNED",
  "PROBLEM_OPEN",
  "CLOSED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const NEXT_STATUSES: Record<BookingStatus, readonly BookingStatus[]> = {
  REQUESTED: ["ACCEPTED", "DECLINED", "EXPIRED"],
  ACCEPTED: ["FEE_PENDING", "CONFIRMED", "CANCELLED"],
  FEE_PENDING: ["CONFIRMED", "EXPIRED"],
  CONFIRMED: ["CHECKED_OUT", "CANCELLED"],
  CHECKED_OUT: ["RETURNED", "OVERDUE"],
  OVERDUE: ["RETURNED"],
  RETURNED: ["CLOSED", "PROBLEM_OPEN"],
  PROBLEM_OPEN: ["CLOSED"],
  CLOSED: [],
  DECLINED: [],
  EXPIRED: [],
  CANCELLED: [],
};

/** States in which a booking holds stock on the calendar. */
export const HOLDS_STOCK: readonly BookingStatus[] = [
  "ACCEPTED",
  "FEE_PENDING",
  "CONFIRMED",
  "CHECKED_OUT",
  "OVERDUE",
];

export function canMove(from: BookingStatus, to: BookingStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  FEE_PENDING: "Fee pending",
  CONFIRMED: "Confirmed",
  CHECKED_OUT: "Checked out",
  OVERDUE: "Overdue",
  RETURNED: "Returned",
  PROBLEM_OPEN: "Problem open",
  CLOSED: "Closed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export const STATUS_TONE: Record<BookingStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-900",
  ACCEPTED: "bg-sky-100 text-sky-900",
  FEE_PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  CHECKED_OUT: "bg-indigo-100 text-indigo-900",
  OVERDUE: "bg-red-100 text-red-900",
  RETURNED: "bg-teal-100 text-teal-900",
  PROBLEM_OPEN: "bg-red-100 text-red-900",
  CLOSED: "bg-zinc-200 text-zinc-700",
  DECLINED: "bg-zinc-200 text-zinc-700",
  EXPIRED: "bg-zinc-200 text-zinc-700",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

/**
 * The moves staff can make from the booking page in Phase 1. Accepting runs
 * the double-booking check; FEE_PENDING belongs to marketplace bookings (Phase 2)
 * and EXPIRED is set by the system, not by staff.
 */
export function staffActions(status: BookingStatus): BookingStatus[] {
  return NEXT_STATUSES[status].filter(
    (s) => s !== "FEE_PENDING" && s !== "CONFIRMED" && s !== "EXPIRED",
  );
}
