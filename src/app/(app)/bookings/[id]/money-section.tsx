import { CopyButton } from "@/components/copy-button";
import { Field, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { formatDate, namibiaToday } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import {
  KIND_LABEL,
  METHOD_LABEL,
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  isOutgoing,
  type Balance,
  type Payment,
} from "@/lib/payments";
import { whatsAppLink } from "@/lib/whatsapp";
import { recordPayment, voidPayment } from "../actions";

// FR-PY-01 to FR-PY-04: what is due, paid and outstanding, deposits, the
// records behind them, and the customer's booking link.
export function MoneySection({
  bookingId,
  balance,
  expectedDeposit,
  payments,
  link,
  shareMessage,
  customerPhone,
}: {
  bookingId: string;
  balance: Balance;
  expectedDeposit: number;
  payments: Payment[];
  link: string;
  shareMessage: string;
  customerPhone: string | undefined;
}) {
  const live = payments.filter((p) => !p.voided_at);
  const voided = payments.filter((p) => p.voided_at);

  return (
    <section id="money" className="mb-4 space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <p className="text-zinc-500">Due</p>
          <p className="font-semibold">{formatNad(balance.amount_due)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <p className="text-zinc-500">Paid</p>
          <p className="font-semibold">{formatNad(balance.amount_paid)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${Number(balance.outstanding) > 0 ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}>
          <p className="text-zinc-500">Outstanding</p>
          <p className="font-semibold">{formatNad(Math.max(Number(balance.outstanding), 0))}</p>
        </div>
      </div>
      <p className="text-sm text-zinc-600">
        Deposit held: <span className="font-semibold text-zinc-900">{formatNad(balance.deposit_held)}</span>
        {Number(balance.deposit_received) === 0 && Number(expectedDeposit) > 0 && ` (expected ${formatNad(expectedDeposit)})`}
      </p>

      {live.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white text-sm">
          {live.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{KIND_LABEL[p.kind]}</span>
                <span className={isOutgoing(p.kind) ? "text-zinc-600" : "font-semibold"}>
                  {isOutgoing(p.kind) ? "−" : ""}{formatNad(p.amount)}
                </span>
              </div>
              <p className="text-zinc-600">
                {formatDate(p.paid_on)}
                {p.method && ` · ${METHOD_LABEL[p.method]}`}
                {p.note && ` · ${p.note}`}
                {p.customer_confirmed_at && " · Confirmed by customer"}
              </p>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-zinc-500 underline">Void this record</summary>
                <form action={voidPayment.bind(null, bookingId, p.id)} className="mt-2 flex gap-2">
                  <input name="reason" required placeholder="Why?" aria-label="Reason for voiding" className={inputClass} />
                  <button className={secondaryButtonClass}>Void</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-xl border border-zinc-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold">Record a payment or deposit</summary>
        <form action={recordPayment.bind(null, bookingId)} className="mt-3 space-y-3">
          <Field label="What happened">
            <select name="kind" defaultValue="RENTAL" className={inputClass}>
              {PAYMENT_KINDS.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (N$)">
              <input name="amount" type="number" min="0.01" step="0.01" required className={inputClass} />
            </Field>
            <Field label="Method">
              <select name="method" defaultValue="cash" className={inputClass}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{METHOD_LABEL[m]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Date">
            <input name="paid_on" type="date" defaultValue={namibiaToday()} required className={inputClass} />
          </Field>
          <Field label="Note" hint="Required when keeping part of the deposit, for example the damage">
            <input name="note" className={inputClass} />
          </Field>
          <button className={`${buttonClass} w-full`}>Save record</button>
          <p className="text-xs text-zinc-500">The customer pays you directly. This only records it.</p>
        </form>
      </details>

      <div className="grid grid-cols-2 gap-3">
        <a href={whatsAppLink(shareMessage, customerPhone)} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
          Send booking link
        </a>
        <CopyButton text={link} />
      </div>

      {voided.length > 0 && (
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer underline">{voided.length} voided record{voided.length > 1 ? "s" : ""}</summary>
          <ul className="mt-1 space-y-1">
            {voided.map((p) => (
              <li key={p.id} className="line-through decoration-zinc-400">
                {KIND_LABEL[p.kind]} {formatNad(p.amount)} on {formatDate(p.paid_on)}
                <span className="no-underline"> ({p.void_reason})</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
