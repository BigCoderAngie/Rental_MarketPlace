import { notFound } from "next/navigation";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { requireBusiness } from "@/lib/business";
import { STATUS_LABEL, staffActions, type BookingStatus } from "@/lib/bookings";
import { daysInclusive, formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import type { Booking } from "@/lib/types";
import { moveBooking } from "../actions";

type Detail = Booking & {
  customers: { full_name: string; phone: string } | null;
  booking_items: { quantity: number; daily_price: number; items: { name: string } | null }[];
  booking_events: { id: number; from_status: BookingStatus | null; to_status: BookingStatus; note: string | null; created_at: string }[];
};

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  ACCEPTED: "Accept and confirm",
  DECLINED: "Decline",
  CANCELLED: "Cancel booking",
  CHECKED_OUT: "Mark checked out",
  OVERDUE: "Mark overdue",
  RETURNED: "Mark returned",
  PROBLEM_OPEN: "Report a problem",
  CLOSED: "Close booking",
};

const NEEDS_NOTE: BookingStatus[] = ["CANCELLED", "DECLINED", "PROBLEM_OPEN"];

export default async function BookingPage({ params, searchParams }: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireBusiness();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, customers(full_name, phone), booking_items(quantity, daily_price, items(name)), booking_events(id, from_status, to_status, note, created_at)")
    .eq("id", id)
    .order("id", { referencedTable: "booking_events" })
    .maybeSingle<Detail>();
  if (!booking) notFound();

  const days = daysInclusive(booking.start_date, booking.end_date);
  const rentalTotal = booking.booking_items.reduce((sum, bi) => sum + bi.quantity * bi.daily_price * days, 0);
  const actions = staffActions(booking.status);

  return (
    <>
      <PageHeader title={booking.reference} action={<StatusBadge status={booking.status} />} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />

      <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="font-medium">{booking.customers?.full_name}</p>
        <p className="text-sm text-zinc-600">{booking.customers?.phone}</p>
        <p className="mt-2 text-sm">{formatRange(booking.start_date, booking.end_date)} ({days} day{days > 1 ? "s" : ""})</p>
        {booking.notes && <p className="mt-2 text-sm text-zinc-600">{booking.notes}</p>}
      </section>

      <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
        <ul className="space-y-1">
          {booking.booking_items.map((bi, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{bi.quantity} × {bi.items?.name}</span>
              <span>{formatNad(bi.quantity * bi.daily_price * days)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-zinc-200 pt-2 font-semibold">
          <span>Rental</span>
          <span>{formatNad(rentalTotal)}</span>
        </p>
        <p className="flex justify-between text-zinc-600">
          <span>Deposit</span>
          <span>{formatNad(booking.deposit_amount)}</span>
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          The customer pays your business directly. Payment records come in the next step of Phase 1.
        </p>
      </section>

      {actions.length > 0 && (
        <section className="mb-4 space-y-3">
          {actions.map((to) =>
            NEEDS_NOTE.includes(to) ? (
              <form key={to} action={moveBooking.bind(null, booking.id, to)} className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
                <Field label={to === "PROBLEM_OPEN" ? "What went wrong?" : "Reason"}>
                  <input name="note" required className={inputClass} />
                </Field>
                <button className={`${secondaryButtonClass} w-full`}>{ACTION_LABEL[to]}</button>
              </form>
            ) : (
              <form key={to} action={moveBooking.bind(null, booking.id, to)}>
                <button className={`${buttonClass} w-full`}>{ACTION_LABEL[to] ?? STATUS_LABEL[to]}</button>
              </form>
            ),
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">History</h2>
        <ol className="space-y-1 text-sm text-zinc-600">
          {booking.booking_events.map((e) => (
            <li key={e.id}>
              {new Date(e.created_at).toLocaleString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium", timeStyle: "short" })}
              {" · "}
              {STATUS_LABEL[e.to_status]}
              {e.note && ` · ${e.note}`}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
