import Link from "next/link";
import { LinkButton, PageHeader, inputClass, secondaryButtonClass } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { requireBusiness } from "@/lib/business";
import { HOLDS_STOCK, type BookingStatus } from "@/lib/bookings";
import { addDays, formatMonth, formatRange, monthGrid, monthRange, namibiaToday, parseMonth, shiftMonth } from "@/lib/dates";
import type { AvailabilityRow, Item } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type BookingRow = {
  id: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  quantity: number;
  customer: string;
};

// FR-CA-04: free units per day for one item, with a low stock warning, and the
// bookings that hold it this month.
export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const params = await searchParams;
  const today = namibiaToday();
  const month = parseMonth(typeof params.month === "string" ? params.month : undefined, today);
  const { first, last } = monthRange(month);

  const { supabase, business } = await requireBusiness();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("business_id", business.id)
    .eq("archived", false)
    .order("name")
    .returns<Item[]>();

  if (!items?.length) {
    return (
      <>
        <PageHeader title="Calendar" />
        <p className="mb-4 text-sm text-muted">Add items to your inventory to see them on the calendar.</p>
        <LinkButton href="/inventory/new">Add item</LinkButton>
      </>
    );
  }

  const item = items.find((i) => i.id === params.item) ?? items[0];

  const [{ data: availability, error }, { data: lines }] = await Promise.all([
    supabase
      .rpc("item_availability", { p_business_id: business.id, p_from: first, p_to: last })
      .eq("item_id", item.id),
    supabase
      .from("booking_items")
      .select("quantity, bookings!inner(id, status, start_date, end_date, customers(full_name))")
      .eq("item_id", item.id)
      .in("bookings.status", HOLDS_STOCK)
      .lte("bookings.start_date", last)
      .gte("bookings.end_date", addDays(first, -item.turnaround_days))
      .returns<{ quantity: number; bookings: { id: string; status: BookingStatus; start_date: string; end_date: string; customers: { full_name: string } | null } }[]>(),
  ]);
  if (error) throw error;

  const byDay = new Map(((availability ?? []) as AvailabilityRow[]).map((r) => [r.day, r]));
  const bookings: BookingRow[] = (lines ?? [])
    .map((l) => ({
      id: l.bookings.id,
      status: l.bookings.status,
      start_date: l.bookings.start_date,
      end_date: l.bookings.end_date,
      quantity: l.quantity,
      customer: l.bookings.customers?.full_name ?? "",
    }))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const href = (m: string) => `/calendar?${new URLSearchParams({ item: item.id, month: m })}`;

  return (
    <>
      <PageHeader title="Calendar" action={<LinkButton href="/bookings/new">New booking</LinkButton>} />

      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="month" value={month} />
        <select name="item" defaultValue={item.id} aria-label="Item" className={inputClass}>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <button className={secondaryButtonClass}>Show</button>
      </form>

      <div className="mb-2 flex items-center justify-between">
        <Link href={href(shiftMonth(month, -1))} className="px-2 py-1 text-sm underline">Previous</Link>
        <h2 className="font-semibold">{formatMonth(month)}</h2>
        <Link href={href(shiftMonth(month, 1))} className="px-2 py-1 text-sm underline">Next</Link>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} className="text-xs font-medium text-muted">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(month).map((week, w) => (
            <tr key={w}>
              {week.map((day, d) => {
                if (!day) return <td key={d} />;
                const row = byDay.get(day);
                const free = row?.available ?? 0;
                const tone =
                  free <= 0
                    ? "bg-danger-soft text-danger-ink"
                    : free <= item.low_stock_threshold
                      ? "bg-gold-soft text-gold-ink"
                      : "bg-surface";
                return (
                  <td key={d} className={`rounded-lg border border-line p-1 align-top ${tone} ${day === today ? "ring-2 ring-brand" : ""}`}>
                    <span className="block text-left text-[10px] text-muted">{Number(day.slice(8))}</span>
                    <span className="block text-sm font-semibold">{Math.max(free, 0)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">
        Units free each day out of {item.quantity_owned - item.units_out_of_service} in service.
        <Swatch className="bg-danger-soft" /> fully booked
        {item.low_stock_threshold > 0 && (
          <>
            , <Swatch className="bg-gold-soft" /> {item.low_stock_threshold} or fewer left
          </>
        )}
        .
        Pending requests do not use stock until accepted.
      </p>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-ink-soft">Bookings holding {item.name} this month</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/bookings/${b.id}`} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{b.quantity} × {b.customer}</span>
                  <span className="text-muted">{formatRange(b.start_date, b.end_date)}</span>
                </span>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const Swatch = ({ className }: { className: string }) => (
  <span className={`inline-block h-3 w-3 rounded-sm border border-line-strong align-[-2px] ${className}`} />
);
