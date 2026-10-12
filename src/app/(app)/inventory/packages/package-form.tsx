import { Field, buttonClass, inputClass } from "@/components/ui";
import type { Package } from "@/lib/packages";
import type { Item } from "@/lib/types";

const qtyClass = `${inputClass} w-24 text-center`;

// One form for adding and editing packages (FR-IN-03).
export function PackageForm({
  action,
  items,
  pkg,
}: {
  action: (formData: FormData) => Promise<void>;
  items: Pick<Item, "id" | "name" | "daily_price">[];
  pkg?: Package;
}) {
  const inPackage = new Map(pkg?.package_items.map((pi) => [pi.item_id, pi.quantity]));

  return (
    <form action={action} className="space-y-4">
      <Field label="Name">
        <input name="name" required defaultValue={pkg?.name} placeholder="e.g. Wedding 100" className={inputClass} />
      </Field>

      <Field label="Description (optional)">
        <textarea name="description" rows={2} defaultValue={pkg?.description ?? ""} className={inputClass} />
      </Field>

      <Field label="Package price per day (N$)">
        <input
          name="daily_price"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          defaultValue={pkg?.daily_price}
          className={inputClass}
        />
      </Field>

      <fieldset className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">What is in the package</legend>
        {items.length === 0 && <p className="text-sm text-zinc-600">Add items to your inventory first.</p>}
        {items.map((item) => (
          <label key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span>{item.name}</span>
            <input
              name={`qty:${item.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={inPackage.get(item.id) ?? ""}
              placeholder="0"
              className={qtyClass}
            />
          </label>
        ))}
      </fieldset>

      <button className={`${buttonClass} w-full`}>Save package</button>
    </form>
  );
}
