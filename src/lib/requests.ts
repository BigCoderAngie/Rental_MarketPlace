// Marketplace requests (docs/build-kit 02-BUSINESS-RULES.md rules 1 to 15): the
// money a renter sees, condition labels and request statuses. The database
// functions in supabase/migrations/20261023030000_marketplace_requests.sql
// hold the rules; this file only words them.

import { daysInclusive, type IsoDate } from "./dates";

export const CONDITIONS = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
} as const;
export type Condition = keyof typeof CONDITIONS;

export function conditionLabel(value: string | null | undefined): string | null {
  return value && value in CONDITIONS ? CONDITIONS[value as Condition] : null;
}

/** What the renter pays the owner at collection. The renter never pays RentLoop (rule 1). */
export function requestMoney(dailyPrice: number, deposit: number, from: IsoDate, to: IsoDate, quantity: number) {
  const days = daysInclusive(from, to);
  const rent = dailyPrice * days * quantity;
  const depositTotal = deposit * quantity;
  return { days, rent, deposit: depositTotal, bookingFee: 0, payOwner: rent + depositTotal };
}

/** The owner's booking fee and what they keep (rule 3), for example 10% of N$1,950. */
export function ownerMoney(total: number, feeRate: number) {
  const fee = Math.round(total * feeRate * 100) / 100;
  return { fee, keep: total - fee, percent: Math.round(feeRate * 1000) / 10 };
}

export type RequestStatus = "REQUESTED" | "EXPIRED" | "PAID" | "DECLINED" | "CANCELLED";

export const STATUS_LABEL: Record<RequestStatus, string> = {
  REQUESTED: "Waiting for owner",
  EXPIRED: "Expired",
  PAID: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

/** "Expires in 21 h", "Expires in 40 min", or "Expired". */
export function expiresIn(expiresAt: string, now: Date = new Date()): string {
  const minutes = Math.floor((new Date(expiresAt).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return "Expired";
  return minutes >= 60 ? `Expires in ${Math.floor(minutes / 60)} h` : `Expires in ${minutes} min`;
}

/** Turns a database error into words for the renter or owner. */
export function requestErrorMessage(error: { message: string }): string {
  if (/Not enough/.test(error.message)) return "Those dates are no longer free. Another booking took them.";
  return error.message;
}
