import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { BusinessHeader, LineCards, TotalsBox } from "@/components/customer-page";
import { ErrorNote, secondaryButtonClass } from "@/components/ui";
import { formatDate, formatDays, formatRange } from "@/lib/dates";
import type { PublicHandover } from "@/lib/handovers";
import { formatNad } from "@/lib/money";
import { extraCharges, type SummaryRow } from "@/lib/price-summary";
import { KIND_LABEL, METHOD_LABEL, isOutgoing } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import type { PublicBooking } from "@/lib/types";
import { whatsAppLink } from "@/lib/whatsapp";
import { confirmPayment } from "./actions";
import { HandoverRecords } from "./handover-records";

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

  // The deposit is separate from the rental total, so it comes after "Still to pay", not inside the sum.
  const totals: SummaryRow[] = [
    ...extraCharges(booking),
    { label: "Total", amount: booking.balance.amount_due, tone: "strong" },
    { label: "Already paid", amount: booking.balance.amount_paid },
    { label: "Still to pay", amount: outstanding, tone: "strong" },
    ...(booking.deposit_amount > 0
      ? [{ label: "Refundable deposit", amount: booking.deposit_amount, tone: "quiet" as const }]
      : []),
  ];
  const showDeposit = booking.deposit_amount > 0 || booking.balance.deposit_held > 0;

  return (
    <>
      <BusinessHeader eyebrow="Booking with" name={b.name} towns={b.towns} />

      <main className="mx-auto max-w-lg px-4 pb-10 pt-5">
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center justify-between gap-2">
            <span className="font-semibold">For {booking.customer_name}</span>
            <StatusBadge status={booking.status} />
          </p>
          <p className="mt-1 text-sm">
            {formatRange(booking.start_date, booking.end_date)} ({formatDays(booking.days)})
          </p>
          <p className="text-sm text-muted-foreground">Booking {booking.reference}</p>
        </section>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-foreground-soft">What you&apos;re hiring</h2>
        <LineCards packages={booking.packages ?? []} items={booking.items} days={booking.days} />

        <div className="mt-4">
          <TotalsBox rows={totals}>
            {showDeposit && (
              <p className="mt-3 text-xs text-muted-foreground">
                Deposit {b.name} is holding for you right now: {formatNad(booking.balance.deposit_held)}.
              </p>
            )}
          </TotalsBox>
        </div>

        {typeof error === "string" && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}

        {booking.payments.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground-soft">Payments recorded by {b.name}</h2>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
              {booking.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="block font-medium">
                      {KIND_LABEL[p.kind]}: {isOutgoing(p.kind) ? "−" : ""}{formatNad(p.amount)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDate(p.paid_on)}{p.method && ` · ${METHOD_LABEL[p.method]}`}{p.note && ` · ${p.note}`}
                    </span>
                  </span>
                  {p.customer_confirmed_at ? (
                    <span className="shrink-0 text-xs font-semibold text-primary">Confirmed</span>
                  ) : (
                    <form action={confirmPayment.bind(null, token, p.id)} className="shrink-0">
                      <button className={secondaryButtonClass}>Confirm</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap Confirm if the amount matches what you paid or received. If something is wrong, message {b.name}.
            </p>
          </section>
        )}

        <HandoverRecords token={token} businessName={b.name} records={handovers} />

        {b.payment_terms && (
          <p className="mt-4 text-sm text-foreground-soft"><span className="font-medium">Payment: </span>{b.payment_terms}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">You pay {b.name} directly. This website does not take payments.</p>

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
    </>
  );
}
