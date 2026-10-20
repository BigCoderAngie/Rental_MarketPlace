// Booking states from SRS section 4.2. The database enforces these rules
// (see supabase/migrations); this copy only decides which buttons to show.

import type { BadgeTone } from "./badge-tones";

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

export const STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  REQUESTED: "accent",
  ACCEPTED: "accent",
  FEE_PENDING: "accent",
  CONFIRMED: "primary",
  CHECKED_OUT: "primary-outline",
  RETURNED: "primary-outline",
  OVERDUE: "danger",
  PROBLEM_OPEN: "danger",
  CLOSED: "muted",
  DECLINED: "muted",
  EXPIRED: "muted",
  CANCELLED: "muted",
};

/**
 * The one-tap moves staff can make from the booking page. Accepting runs the
 * double-booking check; FEE_PENDING belongs to marketplace bookings (Phase 2);
 * EXPIRED and OVERDUE are set by the system; checkout and return have their
 * own forms with counts and photos.
 */
export function staffActions(status: BookingStatus): BookingStatus[] {
  const notButtons: BookingStatus[] = ["FEE_PENDING", "CONFIRMED", "EXPIRED", "OVERDUE", "CHECKED_OUT", "RETURNED"];
  return NEXT_STATUSES[status].filter((s) => !notButtons.includes(s));
}

/** Bookings whose dates and quantities can still be changed (before checkout). */
export const EDITABLE_STATUSES: BookingStatus[] = ["REQUESTED", "ACCEPTED", "FEE_PENDING", "CONFIRMED"];

/** A checked-out booking past its end date, even before the nightly job marks it. */
export function isOverdue(status: BookingStatus, endDate: string, today: string): boolean {
  return status === "OVERDUE" || (status === "CHECKED_OUT" && endDate < today);
}

/**
 * Bookings the business accepted, whatever happened next. Only these count
 * towards money owed and customer history; reports use the same rule.
 */
export function wentAhead(status: BookingStatus): boolean {
  return !["REQUESTED", "DECLINED", "EXPIRED", "CANCELLED"].includes(status);
}
