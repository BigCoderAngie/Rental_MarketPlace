import { DateRangeStep, ItemLines } from "@/components/item-lines";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { itemsWithFreeUnits } from "@/lib/availability";
import { requireBusiness } from "@/lib/business";
import { isIsoDate, namibiaToday } from "@/lib/dates";
import { createBooking } from "../actions";

// Step 1 picks dates (a plain GET form); step 2 shows what is free for the
// whole range and takes quantities and the customer's details.
export default async function NewBookingPage({ searchParams }: PageProps<"/bookings/new">) {
  const params = await searchParams;
  const today = namibiaToday();
  const start = isIsoDate(params.start) ? params.start : today;
  const end = isIsoDate(params.end) && params.end >= start ? params.end : start;
  const error = typeof params.error === "string" ? params.error : undefined;
  const datesChosen = isIsoDate(params.start);
  // Prefilled from a customer's page.
  const customerName = typeof params.customer_name === "string" ? params.customer_name : undefined;
  const customerPhone = typeof params.customer_phone === "string" ? params.customer_phone : undefined;

  const { supabase, business } = await requireBusiness();
  const { items, free, packages } = await itemsWithFreeUnits(supabase, business.id, start, datesChosen ? end : null);

  return (
    <>
      <PageHeader title="New booking" />
      <ErrorNote message={error} />

      <DateRangeStep start={start} end={end} keep={{ customer_name: customerName, customer_phone: customerPhone }} />

      {datesChosen && (
        <form action={createBooking} className="space-y-4">
          <input type="hidden" name="start_date" value={start} />
          <input type="hidden" name="end_date" value={end} />
          <ItemLines items={items} free={free} start={start} end={end} capAtFree packages={packages} />

          <Field label="Customer name">
            <input name="customer_name" required autoComplete="off" defaultValue={customerName} className={inputClass} />
          </Field>
          <Field label="Customer phone" hint="Used to find returning customers">
            <input name="customer_phone" type="tel" required defaultValue={customerPhone} placeholder="+264 81 123 4567" className={inputClass} />
          </Field>
          <Field label="Notes">
            <textarea name="notes" rows={2} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accept" defaultChecked className="h-5 w-5" />
            Confirm now and block the items on the calendar
          </label>
          <button className={`${buttonClass} w-full`}>Save booking</button>
        </form>
      )}
    </>
  );
}
