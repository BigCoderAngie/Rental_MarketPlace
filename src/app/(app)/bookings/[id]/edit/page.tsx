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
  booking_items: { item_id: string; quantity: number; package_units: number; items: { name: string } | null }[];
  booking_packages: { package_id: string; quantity: number; packages: { name: string } | null }[];
};

// FR-BK-07: change the dates or quantities of a booking that hasn't gone out.
// Same two steps as a new booking, starting from the booking as it is.
export default async function EditBookingPage({ params, searchParams }: PageProps<"/bookings/[id]/edit">) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, business } = await requireBusiness();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, customers(full_name), booking_items(item_id, quantity, package_units, items(name)), booking_packages(package_id, quantity, packages(name))")
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
        <p className="text-sm text-muted-foreground">
          This booking can no longer be changed. <Link href={`/bookings/${id}`} className="underline">Back to the booking</Link>
        </p>
      </>
    );
  }

  const { items, free, packages } = await itemsWithFreeUnits(supabase, business.id, start, end, id);
  // Item boxes hold the extras on top of packages.
  const quantities = new Map(booking.booking_items.map((bi) => [bi.item_id, bi.quantity - bi.package_units]));
  const packageQuantities = new Map(booking.booking_packages.map((bp) => [bp.package_id, bp.quantity]));
  // Items and packages taken off the lists stay on the booking as they are.
  const unlisted = booking.booking_items.filter(
    (bi) => bi.quantity > bi.package_units && !items.some((i) => i.id === bi.item_id),
  );
  const unlistedPackages = booking.booking_packages.filter((bp) => !packages.some((p) => p.id === bp.package_id));

  return (
    <>
      <PageHeader title={`Change ${booking.reference}`} />
      <p className="mb-4 text-sm text-muted-foreground">
        {booking.customers?.full_name} · now {formatRange(booking.start_date, booking.end_date)}
      </p>
      <ErrorNote message={error} />

      <DateRangeStep start={start} end={end} />

      <form action={updateBooking.bind(null, id)} className="space-y-4">
        <input type="hidden" name="start_date" value={start} />
        <input type="hidden" name="end_date" value={end} />
        <ItemLines
          items={items}
          free={free}
          start={start}
          end={end}
          capAtFree={false}
          quantities={quantities}
          packages={packages}
          packageQuantities={packageQuantities}
        />
        {unlistedPackages.map((bp) => (
          <p key={bp.package_id} className="text-sm text-muted-foreground">
            <input type="hidden" name={`pkg:${bp.package_id}`} value={bp.quantity} />
            {bp.quantity} × {bp.packages?.name} stays on the booking (no longer in your packages).
          </p>
        ))}
        {unlisted.map((bi) => (
          <p key={bi.item_id} className="text-sm text-muted-foreground">
            <input type="hidden" name={`qty:${bi.item_id}`} value={bi.quantity - bi.package_units} />
            {bi.quantity - bi.package_units} × {bi.items?.name} stays on the booking (no longer in your inventory list).
          </p>
        ))}
        <p className="text-xs text-muted-foreground">
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
