import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorNote, Field, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
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

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <p className="text-sm text-zinc-600">Quote from</p>
      <h1 className="text-2xl font-semibold">{b.name}</h1>
      {b.towns.length > 0 && <p className="text-sm text-zinc-600">{b.towns.join(", ")}</p>}

      <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
        <p className="flex justify-between gap-2">
          <span className="font-medium">For {quote.customer_name}</span>
          <span className="text-zinc-500">{quote.reference}</span>
        </p>
        <p className="mt-1">{formatRange(quote.start_date, quote.end_date)} ({quote.days} day{quote.days > 1 ? "s" : ""})</p>

        <ul className="mt-3 space-y-1">
          {quote.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-2">
              <span>{item.quantity} × {item.name}</span>
              <span>{formatNad(item.quantity * item.daily_price * quote.days)}</span>
            </li>
          ))}
          {quote.delivery_fee > 0 && (
            <li className="flex justify-between"><span>Delivery</span><span>{formatNad(quote.delivery_fee)}</span></li>
          )}
          {quote.setup_fee > 0 && (
            <li className="flex justify-between"><span>Setup</span><span>{formatNad(quote.setup_fee)}</span></li>
          )}
          {quote.discount > 0 && (
            <li className="flex justify-between"><span>Discount</span><span>−{formatNad(quote.discount)}</span></li>
          )}
        </ul>
        <p className="mt-3 flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatNad(quote.total)}</span>
        </p>
        {quote.deposit_amount > 0 && (
          <p className="flex justify-between text-zinc-600">
            <span>Refundable deposit</span>
            <span>{formatNad(quote.deposit_amount)}</span>
          </p>
        )}
        {quote.notes && <p className="mt-3 text-zinc-700">{quote.notes}</p>}
      </section>

      {(b.payment_terms || b.terms) && (
        <section className="mt-4 space-y-2 text-sm text-zinc-700">
          {b.payment_terms && (
            <p><span className="font-medium">Payment: </span>{b.payment_terms}</p>
          )}
          {b.terms && (
            <p className="whitespace-pre-line"><span className="font-medium">Terms: </span>{b.terms}</p>
          )}
          <p className="text-xs text-zinc-500">You pay {b.name} directly. This website does not take payments.</p>
        </section>
      )}

      <div className="mt-6">
        <ErrorNote message={typeof error === "string" ? error : undefined} />

        {quote.status === "OPEN" && (
          <form action={acceptQuote.bind(null, token)} className="space-y-3">
            <Field label="Your name">
              <input name="customer_name" required defaultValue={quote.customer_name} className={inputClass} />
            </Field>
            <Field label="Your phone number">
              <input name="customer_phone" type="tel" required defaultValue={quote.customer_phone ?? ""} className={inputClass} />
            </Field>
            <button className={`${buttonClass} w-full`}>Accept quote</button>
            <p className="text-xs text-zinc-500">
              Valid until {new Date(quote.expires_at).toLocaleDateString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium" })}.
              {" "}{b.name} will confirm your booking.
            </p>
          </form>
        )}

        {quote.status === "ACCEPTED" && (
          <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            You accepted this quote. {b.name} will confirm your booking.
          </p>
        )}
        {quote.status === "EXPIRED" && (
          <p className="rounded-xl bg-zinc-100 p-4 text-sm">This quote has expired. Ask {b.name} for a new one.</p>
        )}
        {quote.status === "CANCELLED" && (
          <p className="rounded-xl bg-zinc-100 p-4 text-sm">{b.name} has withdrawn this quote.</p>
        )}

        {askLink && (
          <a href={askLink} target="_blank" rel="noopener noreferrer" className={`${secondaryButtonClass} mt-3 w-full`}>
            Ask a question on WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}
