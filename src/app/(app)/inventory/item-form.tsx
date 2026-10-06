import { Field, buttonClass, inputClass } from "@/components/ui";
import type { Category, Item } from "@/lib/types";

// One form for adding and editing items (FR-IN-01, FR-IN-02, FR-IN-04, FR-CA-05).
export function ItemForm({
  action,
  categories,
  item,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  item?: Item;
}) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Name">
        <input name="name" required defaultValue={item?.name} className={inputClass} />
      </Field>

      <Field label="Category">
        <select name="category" defaultValue={item?.category ?? "events"} className={inputClass}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description">
        <textarea name="description" rows={2} defaultValue={item?.description ?? ""} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Units owned" hint="300 identical chairs is one item">
          <input name="quantity_owned" type="number" min={0} required defaultValue={item?.quantity_owned ?? 1} className={inputClass} />
        </Field>
        <Field label="Under repair or retired" hint="Not available to book">
          <input name="units_out_of_service" type="number" min={0} defaultValue={item?.units_out_of_service ?? 0} className={inputClass} />
        </Field>
        <Field label="Price per day (N$)">
          <input name="daily_price" type="number" min={0} step="0.01" required defaultValue={item?.daily_price} className={inputClass} />
        </Field>
        <Field label="Deposit per unit (N$)">
          <input name="deposit" type="number" min={0} step="0.01" defaultValue={item?.deposit ?? 0} className={inputClass} />
        </Field>
        <Field label="Replacement value (N$)">
          <input name="replacement_value" type="number" min={0} step="0.01" defaultValue={item?.replacement_value ?? ""} className={inputClass} />
        </Field>
        <Field label="Turnaround days" hint="Cleaning or setup after each hire">
          <input name="turnaround_days" type="number" min={0} max={30} defaultValue={item?.turnaround_days ?? 0} className={inputClass} />
        </Field>
        <Field label="Low stock warning at" hint="0 turns the warning off">
          <input name="low_stock_threshold" type="number" min={0} defaultValue={item?.low_stock_threshold ?? 0} className={inputClass} />
        </Field>
      </div>

      <button className={`${buttonClass} w-full`}>{item ? "Save changes" : "Add item"}</button>
    </form>
  );
}
