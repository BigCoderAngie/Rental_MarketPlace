// Reports (FR-RP-01). The numbers come from business_report() in the database;
// this file picks the period and turns sections into CSV.

import { addDays, isIsoDate, monthOf, monthRange, namibiaToday, shiftMonth, type IsoDate } from "./dates";
import { STATUS_LABEL, type BookingStatus } from "./bookings";
import { METHOD_LABEL, type PaymentMethod } from "./payments";

/** Every section. On Free the database leaves out the four "full" ones. */
export type Report = {
  /** True on plans with full reports and CSV downloads (Pro and Business). */
  full: boolean;
  from: IsoDate;
  to: IsoDate;
  days: number;
  revenue: {
    rental_received: number;
    refunded: number;
    deposits_kept: number;
    total: number;
    by_method: { method: PaymentMethod; amount: number }[];
  };
  bookings: { count: number; went_ahead: number; value: number; by_status: Partial<Record<BookingStatus, number>> };
  items: { name: string; in_service: number; unit_days_booked: number; utilisation: number }[];
  outstanding: { id: string; reference: string; customer: string; start_date: IsoDate; status: BookingStatus; amount: number }[];
  deposits_held: { id: string; reference: string; customer: string; end_date: IsoDate; status: BookingStatus; amount: number }[];
  top_customers: { name: string; phone: string; bookings: number; value: number }[];
};

export const PERIODS = ["this-month", "last-month", "last-30-days", "this-year"] as const;
export type PeriodKey = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-30-days": "Last 30 days",
  "this-year": "This year",
};

export function periodRange(key: PeriodKey, today: IsoDate): { from: IsoDate; to: IsoDate } {
  switch (key) {
    case "this-month": {
      const { first, last } = monthRange(monthOf(today));
      return { from: first, to: last };
    }
    case "last-month": {
      const { first, last } = monthRange(shiftMonth(monthOf(today), -1));
      return { from: first, to: last };
    }
    case "last-30-days":
      return { from: addDays(today, -29), to: today };
    case "this-year":
      return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` };
  }
}

/** The period from ?period= or ?from=&to=, defaulting to this month. */
export function readPeriod(
  params: { period?: string | string[]; from?: string | string[]; to?: string | string[] },
  today: IsoDate = namibiaToday(),
): { from: IsoDate; to: IsoDate; key: PeriodKey | null } {
  const { from, to, period } = params;
  if (isIsoDate(from) && isIsoDate(to)) return { from, to, key: null };
  const key = PERIODS.find((p) => p === period) ?? "this-month";
  return { ...periodRange(key, today), key };
}

export const CSV_SECTIONS = ["revenue", "items", "outstanding", "deposits", "customers"] as const;
export type CsvSection = (typeof CSV_SECTIONS)[number];

function csvCell(value: unknown): string {
  if (typeof value === "number") return String(value);
  const text = value == null ? "" : String(value);
  // Quote anything with commas, quotes or line breaks, and stop spreadsheets
  // from running a customer's name as a formula.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** One report section as CSV, named for the download. */
export function sectionCsv(report: Report, section: CsvSection): { filename: string; csv: string } {
  const period = `${report.from}_to_${report.to}`;
  switch (section) {
    case "revenue":
      return {
        filename: `revenue_${period}.csv`,
        csv: toCsv(
          ["Line", "Amount (N$)"],
          [
            ["Rental received", report.revenue.rental_received],
            ["Refunded", report.revenue.refunded],
            ["Deposits kept", report.revenue.deposits_kept],
            ["Total", report.revenue.total],
            ...report.revenue.by_method.map((m) => [`Rental by ${METHOD_LABEL[m.method]}`, m.amount]),
          ],
        ),
      };
    case "items":
      return {
        filename: `item-use_${period}.csv`,
        csv: toCsv(
          ["Item", "Units in service", "Unit-days booked", "Use (%)"],
          report.items.map((i) => [i.name, i.in_service, i.unit_days_booked, i.utilisation]),
        ),
      };
    case "outstanding":
      return {
        filename: `outstanding_${report.to}.csv`,
        csv: toCsv(
          ["Booking", "Customer", "Starts", "Status", "Owed (N$)"],
          report.outstanding.map((o) => [o.reference, o.customer, o.start_date, STATUS_LABEL[o.status], o.amount]),
        ),
      };
    case "deposits":
      return {
        filename: `deposits-held_${report.to}.csv`,
        csv: toCsv(
          ["Booking", "Customer", "Ends", "Status", "Deposit held (N$)"],
          report.deposits_held.map((d) => [d.reference, d.customer, d.end_date, STATUS_LABEL[d.status], d.amount]),
        ),
      };
    case "customers":
      return {
        filename: `top-customers_${period}.csv`,
        csv: toCsv(
          ["Customer", "Phone", "Bookings", "Value (N$)"],
          report.top_customers.map((c) => [c.name, c.phone, c.bookings, c.value]),
        ),
      };
  }
}
