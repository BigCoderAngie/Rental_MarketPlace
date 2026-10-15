import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { ErrorNote, secondaryButtonClass } from "@/components/ui";
import { formatDate, formatRange } from "@/lib/dates";
import type { PublicHandover } from "@/lib/handovers";
import { formatNad } from "@/lib/money";
import { KIND_LABEL, METHOD_LABEL, isOutgoing } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import type { PublicBooking } from "@/lib/types";
import { whatsAppLink } from "@/lib/whatsapp";
import { confirmPayment } from "./actions";
import { HandoverRecords } from "./handover-records";
import { PackageLines } from "@/components/package-lines";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

// The customer's booking page: what they booked, what they owe, and the
// payments the business recorded, each of which they can confirm (FR-PY-04),
// and the checkout and return records they can agree with or dispute (FR-CR).
export default async function PublicBookingPage({ params, searchParams }: PageProps<"/b/[token]">) {
  const { token } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data, error: lookupError } = await supabase.rpc("get_public_booking", { p_token: token });
  if (lookupError) throw lookupError;
  const booking = data as PublicBooking | null;
  if (!booking) notFound();

  const { data: handoverData, error: handoverError } = await supabase.rpc("get_public_handovers", { p_token: token });
  if (handoverError) throw handoverError;
  const handovers = (handoverData ?? []) as PublicHandover[];

  const b = booking.business;
  const contact = b.whatsapp ?? b.phone;
  const outstanding = Math.max(booking.balance.outstanding, 0);

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <p className="text-sm text-muted">Booking with</p>
      <h1 className="text-2xl font-semibold">{b.name}</h1>
      {b.towns.length > 0 && <p className="text-sm text-muted">{b.towns.join(", ")}</p>}

      <section className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm">
        <p className="flex items-center justify-between gap-2">
          <span className="font-medium">For {booking.customer_name}</span>
          <StatusBadge status={booking.status} />
        </p>
        <p className="mt-1">
          {formatRange(booking.start_date, booking.end_date)} ({booking.days} day{booking.days > 1 ? "s" : ""}) · {booking.reference}
        </p>
        <ul className="mt-3 space-y-1">
          <PackageLines packages={booking.packages ?? []} days={booking.days} />
          {booking.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-2">
              <span>{item.quantity} × {item.name}</span>
              <span>{formatNad(item.quantity * item.daily_price * booking.days)}</span>
            </li>
          ))}
          {booking.delivery_fee > 0 && (
            <li className="flex justify-between"><span>Delivery</span><span>{formatNad(booking.delivery_fee)}</span></li>
          )}
          {booking.setup_fee > 0 && (
            <li className="flex justify-between"><span>Setup</span><span>{formatNad(booking.setup_fee)}</span></li>
          )}
          {booking.discount > 0 && (
            <li className="flex justify-between"><span>Discount</span><span>−{formatNad(booking.discount)}</span></li>
          )}
        </ul>
        <p className="mt-3 flex justify-between border-t border-line pt-2 font-semibold">
          <span>Total</span>
          <span>{formatNad(booking.balance.amount_due)}</span>
        </p>
        <p className="flex justify-between text-muted">
          <span>Paid so far</span>
          <span>{formatNad(booking.balance.amount_paid)}</span>
        </p>
        <p className="flex justify-between text-base font-semibold">
          <span>Still to pay</span>
          <span>{formatNad(outstanding)}</span>
        </p>
        {(booking.balance.deposit_held > 0 || booking.deposit_amount > 0) && (
          <p className="mt-1 flex justify-between text-muted">
            <span>Deposit held by {b.name}</span>
            <span>{formatNad(booking.balance.deposit_held)}</span>
          </p>
        )}
      </section>

      <ErrorNote message={typeof error === "string" ? error : undefined} />

      {booking.payments.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">Payments recorded by {b.name}</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {booking.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block font-medium">
                    {KIND_LABEL[p.kind]}: {isOutgoing(p.kind) ? "−" : ""}{formatNad(p.amount)}
                  </span>
                  <span className="text-muted">
                    {formatDate(p.paid_on)}{p.method && ` · ${METHOD_LABEL[p.method]}`}{p.note && ` · ${p.note}`}
                  </span>
                </span>
                {p.customer_confirmed_at ? (
                  <span className="shrink-0 text-xs font-semibold text-brand">Confirmed</span>
                ) : (
                  <form action={confirmPayment.bind(null, token, p.id)} className="shrink-0">
                    <button className={secondaryButtonClass}>Confirm</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">
            Tap Confirm if the amount matches what you paid or received. If something is wrong, message {b.name}.
          </p>
        </section>
      )}

      <HandoverRecords token={token} businessName={b.name} records={handovers} />

      {b.payment_terms && (
        <p className="mt-4 text-sm text-ink-soft"><span className="font-medium">Payment: </span>{b.payment_terms}</p>
      )}
      <p className="mt-2 text-xs text-muted">You pay {b.name} directly. This website does not take payments.</p>

      {contact && (
        <a
          href={whatsAppLink(`Hi ${b.name}, I have a question about booking ${booking.reference}.`, contact)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${secondaryButtonClass} mt-4 w-full`}
        >
          Message {b.name} on WhatsApp
        </a>
      )}
    </main>
  );
}
