import { inputClass, secondaryButtonClass } from "@/components/ui";
import { describeReturn, type PublicHandover } from "@/lib/handovers";
import { respondToHandover } from "./actions";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-NA", {
    timeZone: "Africa/Windhoek",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// The checkout and return records on the customer's booking page. The
// customer agrees with each one, or says what is wrong (FR-CR-02, FR-CR-05).
export function HandoverRecords({
  token,
  businessName,
  records,
}: {
  token: string;
  businessName: string;
  records: PublicHandover[];
}) {
  if (records.length === 0) return null;

  return (
    <section id="records" className="mt-4">
      <h2 className="mb-2 text-sm font-semibold text-ink-soft">Handover records from {businessName}</h2>
      <ul className="space-y-3">
        {records.map((h) => (
          <li key={h.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="flex justify-between gap-2 font-medium">
              <span>
                {h.kind === "CHECKOUT" ? "You collected" : "You returned"}
                {h.late && <span className="ml-2 rounded bg-danger-soft px-1.5 py-0.5 text-xs text-danger-ink">Late</span>}
              </span>
              <span className="text-muted">{when(h.recorded_at)}</span>
            </p>
            <ul className="mt-2 space-y-0.5">
              {h.lines.map((l) => (
                <li key={l.name}>
                  {h.kind === "CHECKOUT" ? `${l.quantity} × ${l.name}` : `${l.name}: ${describeReturn(l)}`}
                </li>
              ))}
            </ul>
            {h.note && <p className="mt-1 text-muted">{h.note}</p>}
            {h.photo_count > 0 && (
              <p className="mt-1 text-muted">
                {h.photo_count} photo{h.photo_count > 1 ? "s" : ""} taken by {businessName}
              </p>
            )}

            {h.customer_confirmed_at ? (
              <p className="mt-3 text-xs font-semibold text-brand">You agreed with this record</p>
            ) : h.customer_disputed_at ? (
              <p className="mt-3 text-xs font-semibold text-danger">You said: {h.dispute_note}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <form action={respondToHandover.bind(null, token, h.id, true)}>
                  <button className={`${secondaryButtonClass} w-full`}>This is correct</button>
                </form>
                <details>
                  <summary className="cursor-pointer text-sm text-ink-soft underline">Something is wrong</summary>
                  <form action={respondToHandover.bind(null, token, h.id, false)} className="mt-2 space-y-2">
                    <input name="note" required placeholder="What is wrong?" className={inputClass} />
                    <button className={`${secondaryButtonClass} w-full`}>Send to {businessName}</button>
                  </form>
                </details>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
