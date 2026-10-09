import { PhotoUpload } from "@/components/photo-upload";
import { Field, buttonClass, inputClass } from "@/components/ui";
import type { BookingStatus } from "@/lib/bookings";
import { PHOTO_BUCKET, describeReturn, handoverPhotoFolder, type Handover } from "@/lib/handovers";
import { recordCheckout, recordReturn } from "../actions";

const countClass = `${inputClass} w-20 text-center`;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-NA", {
    timeZone: "Africa/Windhoek",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CustomerResponse({ h }: { h: Handover }) {
  if (h.customer_confirmed_at) {
    return <p className="mt-2 text-xs font-semibold text-emerald-700">Customer agreed {when(h.customer_confirmed_at)}</p>;
  }
  if (h.customer_disputed_at) {
    return (
      <p className="mt-2 text-xs font-semibold text-red-800">
        Customer disputed {when(h.customer_disputed_at)}: {h.dispute_note}
      </p>
    );
  }
  return <p className="mt-2 text-xs text-zinc-500">Waiting for the customer to agree on their booking link.</p>;
}

function Record({ h, photoUrls }: { h: Handover; photoUrls: Record<string, string> }) {
  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
      <p className="flex justify-between gap-2 font-medium">
        <span>
          {h.kind === "CHECKOUT" ? "Checked out" : "Returned"}
          {h.late && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-900">Late</span>}
        </span>
        <span className="text-zinc-600">{when(h.recorded_at)}</span>
      </p>
      <ul className="mt-2 space-y-0.5">
        {h.handover_lines.map((l) => (
          <li key={l.item_id}>
            {h.kind === "CHECKOUT"
              ? `${l.quantity} × ${l.items?.name}`
              : `${l.items?.name}: ${describeReturn(l)}`}
          </li>
        ))}
      </ul>
      {h.kind === "CHECKOUT" && (
        <p className="mt-1 text-zinc-600">{h.id_checked ? "ID checked" : "ID not checked"}</p>
      )}
      {h.note && <p className="mt-1 text-zinc-600">{h.note}</p>}
      {h.handover_photos.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {h.handover_photos.map((p) =>
            photoUrls[p.storage_path] ? (
              <a key={p.id} href={photoUrls[p.storage_path]} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
                <img src={photoUrls[p.storage_path]} alt="" className="aspect-square w-full rounded-lg object-cover" />
              </a>
            ) : null,
          )}
        </div>
      )}
      <CustomerResponse h={h} />
    </li>
  );
}

/**
 * Checkout and return (SRS 5.8): the form for the next step, then the saved
 * records with photos and the customer's response.
 */
export function HandoverSection({
  businessId,
  bookingId,
  status,
  bookedItems,
  handovers,
  photoUrls,
}: {
  businessId: string;
  bookingId: string;
  status: BookingStatus;
  bookedItems: { item_id: string; name: string; quantity: number }[];
  handovers: Handover[];
  photoUrls: Record<string, string>;
}) {
  const checkout = handovers.find((h) => h.kind === "CHECKOUT");
  const records = [...handovers].sort(
    (a, b) => a.recorded_at.localeCompare(b.recorded_at) || (a.kind === "CHECKOUT" ? -1 : 1),
  );

  return (
    <section id="handover" className="mb-4 space-y-3">
      {status === "CONFIRMED" && (
        <form action={recordCheckout.bind(null, bookingId)} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold">Check out</h2>
          <p className="text-sm text-zinc-600">Count what the customer takes.</p>
          {bookedItems.map((i) => (
            <label key={i.item_id} className="flex items-center justify-between gap-3 text-sm">
              <span>{i.name} <span className="text-zinc-500">({i.quantity} booked)</span></span>
              <input
                name={`qty:${i.item_id}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={i.quantity}
                defaultValue={i.quantity}
                className={countClass}
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input name="id_checked" type="checkbox" className="h-5 w-5" />
            I checked the customer&apos;s ID
          </label>
          <PhotoUpload bucket={PHOTO_BUCKET} folder={handoverPhotoFolder(businessId, bookingId)} />
          <Field label="Note (optional)">
            <input name="note" className={inputClass} placeholder="e.g. One chair has a scratch" />
          </Field>
          <button className={`${buttonClass} w-full`}>Record checkout</button>
        </form>
      )}

      {(status === "CHECKED_OUT" || status === "OVERDUE") && checkout && (
        <form action={recordReturn.bind(null, bookingId)} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold">Record return</h2>
          <p className="text-sm text-zinc-600">For each item, count how many came back fine, damaged or missing.</p>
          {checkout.handover_lines.map((l) => (
            <fieldset key={l.item_id} className="space-y-2 border-t border-zinc-100 pt-2 text-sm">
              <legend className="font-medium">{l.items?.name} <span className="font-normal text-zinc-500">({l.quantity} went out)</span></legend>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-600">Fine</span>
                  <input name={`fine:${l.item_id}`} type="number" inputMode="numeric" min={0} defaultValue={l.quantity} className={countClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-600">Damaged</span>
                  <input name={`damaged:${l.item_id}`} type="number" inputMode="numeric" min={0} defaultValue={0} className={countClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-600">Missing</span>
                  <input name={`missing:${l.item_id}`} type="number" inputMode="numeric" min={0} defaultValue={0} className={countClass} />
                </label>
              </div>
            </fieldset>
          ))}
          <PhotoUpload bucket={PHOTO_BUCKET} folder={handoverPhotoFolder(businessId, bookingId)} />
          <Field label="Note (optional)">
            <input name="note" className={inputClass} placeholder="e.g. Tent returned wet" />
          </Field>
          <button className={`${buttonClass} w-full`}>Record return</button>
        </form>
      )}

      {records.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-zinc-700">Checkout and return</h2>
          <ul className="space-y-3">
            {records.map((h) => (
              <Record key={h.id} h={h} photoUrls={photoUrls} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
