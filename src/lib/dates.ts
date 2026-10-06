// Dates are plain "YYYY-MM-DD" strings in Namibian time (SRS: UTC+2).
// Arithmetic runs in UTC so daylight saving can never shift a day.

export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  return toUtc(value).toISOString().slice(0, 10) === value;
}

function toUtc(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function namibiaToday(now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Windhoek" }).format(now);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Number of days from start to end, counting both ends. */
export function daysInclusive(start: IsoDate, end: IsoDate): number {
  return Math.round((toUtc(end).getTime() - toUtc(start).getTime()) / 86_400_000) + 1;
}

/** "2026-10" for any date in October 2026. */
export function monthOf(date: IsoDate): string {
  return date.slice(0, 7);
}

export function parseMonth(value: string | undefined, fallback: IsoDate): string {
  return value && ISO_MONTH.test(value) ? value : monthOf(fallback);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthRange(month: string): { first: IsoDate; last: IsoDate } {
  const first = `${month}-01`;
  return { first, last: addDays(`${shiftMonth(month, 1)}-01`, -1) };
}

/**
 * Weeks (Monday first) covering a month. Days outside the month are null,
 * so the grid lines up under the weekday headings.
 */
export function monthGrid(month: string): (IsoDate | null)[][] {
  const { first, last } = monthRange(month);
  const leading = (toUtc(first).getUTCDay() + 6) % 7;
  const cells: (IsoDate | null)[] = Array(leading).fill(null);
  for (let d = first; d <= last; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (IsoDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatMonth(month: string): string {
  return toUtc(`${month}-01`).toLocaleDateString("en-NA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDate(date: IsoDate): string {
  return toUtc(date).toLocaleDateString("en-NA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatRange(start: IsoDate, end: IsoDate): string {
  return start === end ? formatDate(start) : `${formatDate(start)} to ${formatDate(end)}`;
}
