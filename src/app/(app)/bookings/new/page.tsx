import { ErrorNote, Field, PageHeader, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { addDays, daysInclusive, isIsoDate, namibiaToday } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import type { AvailabilityRow, Item } from "@/lib/types";
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

  const { supabase, business } = await requireBusiness();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("business_id", business.id)
    .eq("archived", false)
    .order("name")
    .returns<Item[]>();

  // Lowest free quantity on any day of the range, counting turnaround.
  const freeForRange = new Map<string, number>();
  if (datesChosen && items?.length) {
    const longestTurnaround = Math.max(...items.map((i) => i.turnaround_days));
    const { data } = await supabase.rpc("item_availability", {
      p_business_id: business.id,
      p_from: start,
      p_to: addDays(end, longestTurnaround),
    });
    const rows = data as AvailabilityRow[] | null;
    const lastDay = new Map(items.map((i) => [i.id, addDays(end, i.turnaround_days)]));
    for (const r of rows ?? []) {
      if (r.day > lastDay.get(r.item_id)!) continue;
      freeForRange.set(r.item_id, Math.min(freeForRange.get(r.item_id) ?? Infinity, r.available));
    }
  }

  return (
    <>
      <PageHeader title="New booking" />
      <ErrorNote message={error} />

      <form method="get" className="mb-6 grid grid-cols-2 gap-3">
        <Field label="From">
          <input type="date" name="start" defaultValue={start} required className={inputClass} />
        </Field>
        <Field label="To">
          <input type="date" name="end" defaultValue={end} required className={inputClass} />
        </Field>
        <button className={`${secondaryButtonClass} col-span-2`}>Check what is free</button>
      </form>

      {datesChosen && (
        <form action={createBooking} className="space-y-4">
          <input type="hidden" name="start_date" value={start} />
          <input type="hidden" name="end_date" value={end} />
          <p className="text-sm text-zinc-600">
            {daysInclusive(start, end)} day{daysInclusive(start, end) > 1 ? "s" : ""}. Numbers show what is free on every day.
          </p>

          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {(items ?? []).map((item) => {
              const free = Math.max(freeForRange.get(item.id) ?? 0, 0);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="block font-medium">{item.name}</span>
                    <span className={`text-sm ${free === 0 ? "text-red-700" : "text-zinc-600"}`}>
                      {free} free · {formatNad(item.daily_price)} per day
                    </span>
                  </span>
                  <input
                    type="number"
                    name={`qty:${item.id}`}
                    min={0}
                    max={free}
                    defaultValue={0}
                    disabled={free === 0}
                    aria-label={`Quantity of ${item.name}`}
                    className={`${inputClass} w-20 text-right`}
                  />
                </li>
              );
            })}
          </ul>

          <Field label="Customer name">
            <input name="customer_name" required autoComplete="off" className={inputClass} />
          </Field>
          <Field label="Customer phone" hint="Used to find returning customers">
            <input name="customer_phone" type="tel" required placeholder="+264 81 123 4567" className={inputClass} />
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
