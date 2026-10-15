import { DateRangeStep, ItemLines } from "@/components/item-lines";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { itemsWithFreeUnits } from "@/lib/availability";
import { requireBusiness } from "@/lib/business";
import { isIsoDate, namibiaToday } from "@/lib/dates";
import { createQuote } from "../actions";

// FR-QT-01: items, quantities and dates, with optional delivery, setup and
// discount lines. A quote does not hold stock.
export default async function NewQuotePage({ searchParams }: PageProps<"/quotes/new">) {
  const params = await searchParams;
  const start = isIsoDate(params.start) ? params.start : namibiaToday();
  const end = isIsoDate(params.end) && params.end >= start ? params.end : start;
  const error = typeof params.error === "string" ? params.error : undefined;
  const datesChosen = isIsoDate(params.start);

  const { supabase, business } = await requireBusiness();
  const { items, free, packages } = await itemsWithFreeUnits(supabase, business.id, start, datesChosen ? end : null);

  return (
    <>
      <PageHeader title="New quote" />
      <ErrorNote message={error} />

      <DateRangeStep start={start} end={end} />

      {datesChosen && (
        <form action={createQuote} className="space-y-4">
          <input type="hidden" name="start_date" value={start} />
          <input type="hidden" name="end_date" value={end} />
          <ItemLines items={items} free={free} start={start} end={end} capAtFree={false} packages={packages} />

          <div className="grid grid-cols-3 gap-3">
            <Field label="Delivery (N$)">
              <input name="delivery_fee" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
            </Field>
            <Field label="Setup (N$)">
              <input name="setup_fee" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
            </Field>
            <Field label="Discount (N$)">
              <input name="discount" type="number" min={0} step="0.01" defaultValue={0} className={inputClass} />
            </Field>
          </div>

          <Field label="Customer name">
            <input name="customer_name" required autoComplete="off" className={inputClass} />
          </Field>
          <Field label="Customer WhatsApp number" hint="Optional. Without it, you pick the chat when you share.">
            <input name="customer_phone" type="tel" placeholder="081 123 4567" className={inputClass} />
          </Field>
          <Field label="Note for the customer">
            <textarea name="notes" rows={2} className={inputClass} />
          </Field>
          <p className="text-xs text-muted-foreground">
            The quote is valid for {business.quote_validity_days} days. Items are checked again when the customer accepts.
          </p>
          <button className={`${buttonClass} w-full`}>Create quote</button>
        </form>
      )}
    </>
  );
}
