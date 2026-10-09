import Link from "next/link";
import { notFound } from "next/navigation";
import { DateRangeStep, ItemLines } from "@/components/item-lines";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { itemsWithFreeUnits } from "@/lib/availability";
import { EDITABLE_STATUSES } from "@/lib/bookings";
import { requireBusiness } from "@/lib/business";
import { formatRange, isIsoDate } from "@/lib/dates";
import type { Booking } from "@/lib/types";
import { updateBooking } from "../../actions";

type Detail = Booking & {
  customers: { full_name: string } | null;
  booking_items: { item_id: string; quantity: number; items: { name: string } | null }[];
};

// FR-BK-07: change the dates or quantities of a booking that hasn't gone out.
// Same two steps as a new booking, starting from the booking as it is.
export default async function EditBookingPage({ params, searchParams }: PageProps<"/bookings/[id]/edit">) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, business } = await requireBusiness();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, customers(full_name), booking_items(item_id, quantity, items(name))")
    .eq("id", id)
    .maybeSingle<Detail>();
  if (!booking) notFound();

  const start = isIsoDate(query.start) ? query.start : booking.start_date;
  const end = isIsoDate(query.end) && query.end >= start ? query.end : start < booking.end_date ? booking.end_date : start;
  const error = typeof query.error === "string" ? query.error : undefined;

  if (!EDITABLE_STATUSES.includes(booking.status)) {
    return (
      <>
        <PageHeader title={`Change ${booking.reference}`} />
        <p className="text-sm text-zinc-600">
          This booking can no longer be changed. <Link href={`/bookings/${id}`} className="underline">Back to the booking</Link>
        </p>
      </>
    );
  }

  const { items, free } = await itemsWithFreeUnits(supabase, business.id, start, end, id);
  const quantities = new Map(booking.booking_items.map((bi) => [bi.item_id, bi.quantity]));
  // Items taken off the inventory list stay on the booking as they are.
  const unlisted = booking.booking_items.filter((bi) => !items.some((i) => i.id === bi.item_id));

  return (
    <>
      <PageHeader title={`Change ${booking.reference}`} />
      <p className="mb-4 text-sm text-zinc-600">
        {booking.customers?.full_name} · now {formatRange(booking.start_date, booking.end_date)}
      </p>
      <ErrorNote message={error} />

      <DateRangeStep start={start} end={end} />

      <form action={updateBooking.bind(null, id)} className="space-y-4">
        <input type="hidden" name="start_date" value={start} />
        <input type="hidden" name="end_date" value={end} />
        <ItemLines items={items} free={free} start={start} end={end} capAtFree={false} quantities={quantities} />
        {unlisted.map((bi) => (
          <p key={bi.item_id} className="text-sm text-zinc-600">
            <input type="hidden" name={`qty:${bi.item_id}`} value={bi.quantity} />
            {bi.quantity} × {bi.items?.name} stays on the booking (no longer in your inventory list).
          </p>
        ))}
        <p className="text-xs text-zinc-500">
          Set an item to 0 to remove it. Free numbers leave out this booking&apos;s own units. Items already on the
          booking keep the price they were booked at.
        </p>
        <Field label="Reason (optional)">
          <input name="note" className={inputClass} placeholder="e.g. Customer moved the wedding a day later" />
        </Field>
        <button className={`${buttonClass} w-full`}>Save changes</button>
      </form>
    </>
  );
}
