import { Field, inputClass, secondaryButtonClass } from "@/components/ui";
import { daysInclusive, type IsoDate } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import type { Item } from "@/lib/types";

/** Step 1 of a booking or quote: a plain GET form that reloads the page with the dates. */
export function DateRangeStep({ start, end }: { start: IsoDate; end: IsoDate }) {
  return (
    <form method="get" className="mb-6 grid grid-cols-2 gap-3">
      <Field label="From">
        <input type="date" name="start" defaultValue={start} required className={inputClass} />
      </Field>
      <Field label="To">
        <input type="date" name="end" defaultValue={end} required className={inputClass} />
      </Field>
      <button className={`${secondaryButtonClass} col-span-2`}>Check what is free</button>
    </form>
  );
}

/**
 * Step 2: one quantity box per item, named "qty:<item id>" (see readLines).
 * Bookings cap each box at what is free; quotes allow more but flag it,
 * because availability is checked again when the customer accepts.
 */
export function ItemLines({
  items,
  free,
  start,
  end,
  capAtFree,
}: {
  items: Item[];
  free: Map<string, number>;
  start: IsoDate;
  end: IsoDate;
  capAtFree: boolean;
}) {
  const days = daysInclusive(start, end);
  return (
    <>
      <p className="text-sm text-zinc-600">
        {days} day{days > 1 ? "s" : ""}. Numbers show what is free on every day.
      </p>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {items.map((item) => {
          const available = free.get(item.id) ?? 0;
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block font-medium">{item.name}</span>
                <span className={`text-sm ${available === 0 ? "text-red-700" : "text-zinc-600"}`}>
                  {available} free · {formatNad(item.daily_price)} per day
                </span>
              </span>
              <input
                type="number"
                name={`qty:${item.id}`}
                min={0}
                max={capAtFree ? available : undefined}
                defaultValue={0}
                disabled={capAtFree && available === 0}
                aria-label={`Quantity of ${item.name}`}
                className={`${inputClass} w-20 text-right`}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
