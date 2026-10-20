import { daysInclusive, formatRange, type IsoDate } from "./dates";
import { formatNad } from "./money";
import type { BadgeTone } from "./badge-tones";

export type QuoteStatus = "OPEN" | "ACCEPTED" | "CANCELLED" | "EXPIRED";

export type QuoteMoney = {
  start_date: IsoDate;
  end_date: IsoDate;
  delivery_fee: number;
  setup_fee: number;
  discount: number;
  /** package_units of a line are charged through its package, not the item price. */
  lines: { quantity: number; daily_price: number; package_units?: number }[];
  packages?: { quantity: number; daily_price: number }[];
};

/** Same sum as quote_total() in the database: rental for every day, plus extras, less discount. */
export function quoteTotals(q: QuoteMoney) {
  const days = daysInclusive(q.start_date, q.end_date);
  const perDay =
    q.lines.reduce((sum, l) => sum + (Number(l.quantity) - Number(l.package_units ?? 0)) * Number(l.daily_price), 0) +
    (q.packages ?? []).reduce((sum, p) => sum + Number(p.quantity) * Number(p.daily_price), 0);
  const rental = perDay * days;
  const total = Math.max(rental + Number(q.delivery_fee) + Number(q.setup_fee) - Number(q.discount), 0);
  return { days, rental, total };
}

/** An open quote past its expiry reads as expired, as on the customer's page. */
export function effectiveQuoteStatus(status: QuoteStatus, expiresAt: string, now = new Date()): QuoteStatus {
  return status === "OPEN" && new Date(expiresAt) < now ? "EXPIRED" : status;
}

/** The pre-filled WhatsApp message that carries the quote link (FR-QT-02). */
export function quoteMessage(args: {
  customerName: string;
  businessName: string;
  reference: string;
  start: IsoDate;
  end: IsoDate;
  total: number;
  url: string;
}): string {
  const firstName = args.customerName.trim().split(/\s+/)[0];
  return [
    `Hi ${firstName}, here is your quote ${args.reference} from ${args.businessName}`,
    `for ${formatRange(args.start, args.end)}: ${formatNad(args.total)}.`,
    ``,
    `View and accept it here: ${args.url}`,
  ].join("\n");
}

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  OPEN: "Open",
  ACCEPTED: "Accepted",
  CANCELLED: "Withdrawn",
  EXPIRED: "Expired",
};

export const QUOTE_STATUS_TONE: Record<QuoteStatus, BadgeTone> = {
  OPEN: "accent",
  ACCEPTED: "primary",
  CANCELLED: "muted",
  EXPIRED: "muted",
};
