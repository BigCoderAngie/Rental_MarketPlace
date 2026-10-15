import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessHeader, LineCards, TotalsBox } from "@/components/customer-page";
import { QuoteBadge } from "@/components/status-badge";
import { ErrorNote, Field, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { formatDays, formatRange } from "@/lib/dates";
import { itemPhotoUrl } from "@/lib/item-photos";
import { extraCharges, type SummaryRow } from "@/lib/price-summary";
import { createClient } from "@/lib/supabase/server";
import type { PublicQuote } from "@/lib/types";
import { whatsAppLink } from "@/lib/whatsapp";
import { acceptQuote } from "./actions";

export const metadata: Metadata = {
  title: "Your quote",
  robots: { index: false, follow: false },
};

// FR-QT-03: the customer's quote page. Opens from the WhatsApp link with no
// app install or account; the token in the address is the only key.
export default async function PublicQuotePage({ params, searchParams }: PageProps<"/q/[token]">) {
  const { token } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data, error: lookupError } = await supabase.rpc("get_public_quote", { p_token: token });
  if (lookupError) throw lookupError;
  const quote = data as PublicQuote | null;
  if (!quote) notFound();

  const b = quote.business;
  const contact = b.whatsapp ?? b.phone;
  const askLink = contact
    ? whatsAppLink(`Hi ${b.name}, I have a question about quote ${quote.reference}.`, contact)
    : null;

  const open = quote.status === "OPEN";
  const validUntil = new Date(quote.expires_at).toLocaleDateString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium" });
  const totals: SummaryRow[] = [
    ...extraCharges(quote),
    { label: "Total", amount: quote.total, tone: "strong" },
    ...(quote.deposit_amount > 0 ? [{ label: "Refundable deposit", amount: quote.deposit_amount, tone: "quiet" as const }] : []),
  ];

  return (
    <>
      <BusinessHeader eyebrow="Quote from" name={b.name} towns={b.towns} />

      {/* While the quote is open, phones get a sticky action bar: leave room for it. */}
      <main className={`mx-auto max-w-lg px-4 pt-5 ${open ? "pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-10" : "pb-10"}`}>
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center justify-between gap-2">
            <span className="font-semibold">For {quote.customer_name}</span>
            <QuoteBadge status={quote.status} />
          </p>
          <p className="mt-1 text-sm">
            {formatRange(quote.start_date, quote.end_date)} ({formatDays(quote.days)})
          </p>
          <p className="text-sm text-muted-foreground">Quote {quote.reference}</p>
          {quote.notes && <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm text-foreground-soft">{quote.notes}</p>}
        </section>

        <h2 className="mb-2 mt-6 text-sm font-semibold text-foreground-soft">What you&apos;re hiring</h2>
        <LineCards
          packages={quote.packages ?? []}
          items={quote.items}
          days={quote.days}
          photoUrl={(path) => itemPhotoUrl(supabase, path)}
        />

        <div className="mt-4">
          <TotalsBox rows={totals}>
            <p className="mt-3 text-xs text-muted-foreground">You pay {b.name} directly once they confirm. This website does not take payments.</p>
          </TotalsBox>
        </div>

        {(b.payment_terms || b.terms) && (
          <section className="mt-4 space-y-2 text-sm text-foreground-soft">
            {b.payment_terms && (
              <p><span className="font-medium">Payment: </span>{b.payment_terms}</p>
            )}
            {b.terms && (
              <p className="whitespace-pre-line"><span className="font-medium">Terms: </span>{b.terms}</p>
            )}
          </section>
        )}

        <div className="mt-6">
          <ErrorNote message={typeof error === "string" ? error : undefined} />

          {open && (
            <form id="accept-quote" action={acceptQuote.bind(null, token)} className="space-y-3">
              <Field label="Your name">
                <input name="customer_name" required defaultValue={quote.customer_name} className={inputClass} />
              </Field>
              <Field label="Your phone number">
                <input name="customer_phone" type="tel" required defaultValue={quote.customer_phone ?? ""} className={inputClass} />
              </Field>
              {/* Also shown on phones: the sticky bar's button relies on form="accept-quote", which some older in-app browsers ignore. */}
              <button className={`${buttonClass} w-full`}>Accept quote</button>
              <p className="text-xs text-muted-foreground">
                Valid until {validUntil}. {b.name} will confirm your booking.
              </p>
            </form>
          )}

          {quote.status === "ACCEPTED" && (
            <p className="rounded-xl bg-primary-soft p-4 text-sm text-primary-ink">
              You accepted this quote. {b.name} will confirm your booking.
            </p>
          )}
          {quote.status === "EXPIRED" && (
            <p className="rounded-xl bg-muted p-4 text-sm">This quote has expired. Ask {b.name} for a new one.</p>
          )}
          {quote.status === "CANCELLED" && (
            <p className="rounded-xl bg-muted p-4 text-sm">{b.name} has withdrawn this quote.</p>
          )}

          {askLink && (
            <div className={open ? "hidden sm:block" : undefined}>
              <a href={askLink} target="_blank" rel="noopener noreferrer" className={`${secondaryButtonClass} mt-3 w-full`}>
                Ask on WhatsApp
              </a>
            </div>
          )}
        </div>
      </main>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] sm:hidden">
          <div className={`mx-auto grid max-w-lg gap-2 ${askLink ? "grid-cols-2" : ""}`}>
            {askLink && (
              <a href={askLink} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
                Ask on WhatsApp
              </a>
            )}
            <button form="accept-quote" className={buttonClass}>
              Accept quote
            </button>
          </div>
        </div>
      )}
    </>
  );
}
