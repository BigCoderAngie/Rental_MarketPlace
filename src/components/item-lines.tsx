import { Field, inputClass, secondaryButtonClass } from "@/components/ui";
import { daysInclusive, type IsoDate } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { packageContents, packagesFree, type Package } from "@/lib/packages";
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
 * Step 2: one quantity box per package ("pkg:<package id>", see
 * readPackageLines) and per item ("qty:<item id>", see readLines).
 * Bookings cap each box at what is free; quotes allow more but flag it,
 * because availability is checked again when the customer accepts.
 */
export function ItemLines({
  items,
  free,
  start,
  end,
  capAtFree,
  quantities,
  packages = [],
  packageQuantities,
}: {
  items: Item[];
  free: Map<string, number>;
  start: IsoDate;
  end: IsoDate;
  capAtFree: boolean;
  /** Starting quantities, when editing a booking. */
  quantities?: Map<string, number>;
  packages?: Package[];
  packageQuantities?: Map<string, number>;
}) {
  const days = daysInclusive(start, end);
  return (
    <>
      <p className="text-sm text-zinc-600">
        {days} day{days > 1 ? "s" : ""}. Numbers show what is free on every day.
      </p>
      {packages.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-emerald-200 bg-emerald-50/40">
          {packages.map((pkg) => {
            const available = packagesFree(pkg, free);
            return (
              <li key={pkg.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block font-medium">{pkg.name}</span>
                  <span className="block text-xs text-zinc-600">{packageContents(pkg)}</span>
                  <span className={`text-sm ${available === 0 ? "text-red-700" : "text-zinc-600"}`}>
                    {available} free · {formatNad(pkg.daily_price)} per day
                  </span>
                </span>
                <input
                  type="number"
                  name={`pkg:${pkg.id}`}
                  min={0}
                  max={capAtFree ? available : undefined}
                  defaultValue={packageQuantities?.get(pkg.id) ?? 0}
                  disabled={capAtFree && available === 0}
                  aria-label={`Quantity of ${pkg.name}`}
                  className={`${inputClass} w-20 text-right`}
                />
              </li>
            );
          })}
        </ul>
      )}
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
                defaultValue={quantities?.get(item.id) ?? 0}
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
