import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { PackageLines } from "@/components/package-lines";
import { QuoteBadge } from "@/components/quote-badge";
import { ErrorNote, PageHeader, buttonClass, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { packageContents, type Package, type PackageItem } from "@/lib/packages";
import { effectiveQuoteStatus, quoteMessage, quoteTotals } from "@/lib/quotes";
import { siteUrl } from "@/lib/site-url";
import type { Quote } from "@/lib/types";
import { whatsAppLink } from "@/lib/whatsapp";
import { cancelQuote } from "../actions";

type Detail = Quote & {
  quote_items: { quantity: number; package_units: number; daily_price: number; items: { name: string } | null }[];
  quote_packages: { quantity: number; daily_price: number; packages: (Pick<Package, "name"> & { package_items: PackageItem[] }) | null }[];
  bookings: { reference: string } | null;
};

export default async function QuotePage({ params, searchParams }: PageProps<"/quotes/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_items(quantity, package_units, daily_price, items(name)), quote_packages(quantity, daily_price, packages(name, package_items(item_id, quantity, items(name)))), bookings(reference)")
    .eq("id", id)
    .maybeSingle<Detail>();
  if (!quote) notFound();

  const status = effectiveQuoteStatus(quote.status, quote.expires_at);
  const { days, total } = quoteTotals({ ...quote, lines: quote.quote_items, packages: quote.quote_packages });
  const url = `${await siteUrl()}/q/${quote.public_token}`;
  const message = quoteMessage({
    customerName: quote.customer_name,
    businessName: business.name,
    reference: quote.reference,
    start: quote.start_date,
    end: quote.end_date,
    total,
    url,
  });

  return (
    <>
      <PageHeader title={quote.reference} action={<QuoteBadge status={status} />} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />

      <section className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{quote.customer_name}</p>
        {quote.customer_phone && <p className="text-muted-foreground">{quote.customer_phone}</p>}
        <p className="mt-2">{formatRange(quote.start_date, quote.end_date)} ({days} day{days > 1 ? "s" : ""})</p>

        <ul className="mt-3 space-y-1">
          <PackageLines
            days={days}
            packages={quote.quote_packages.map((qp) => ({
              name: qp.packages?.name ?? "",
              quantity: qp.quantity,
              daily_price: qp.daily_price,
              contents: qp.packages ? packageContents(qp.packages) : undefined,
            }))}
          />
          {quote.quote_items.filter((qi) => qi.quantity > qi.package_units).map((qi, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{qi.quantity - qi.package_units} × {qi.items?.name}</span>
              <span>{formatNad((qi.quantity - qi.package_units) * qi.daily_price * days)}</span>
            </li>
          ))}
          {Number(quote.delivery_fee) > 0 && (
            <li className="flex justify-between"><span>Delivery</span><span>{formatNad(quote.delivery_fee)}</span></li>
          )}
          {Number(quote.setup_fee) > 0 && (
            <li className="flex justify-between"><span>Setup</span><span>{formatNad(quote.setup_fee)}</span></li>
          )}
          {Number(quote.discount) > 0 && (
            <li className="flex justify-between"><span>Discount</span><span>−{formatNad(quote.discount)}</span></li>
          )}
        </ul>
        <p className="mt-3 flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatNad(total)}</span>
        </p>
        <p className="flex justify-between text-muted-foreground">
          <span>Deposit</span>
          <span>{formatNad(quote.deposit_amount)}</span>
        </p>
        {status === "OPEN" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Valid until {new Date(quote.expires_at).toLocaleDateString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium" })}.
          </p>
        )}
      </section>

      {status === "OPEN" && (
        <section className="mb-4 space-y-3">
          <a href={whatsAppLink(message, quote.customer_phone)} target="_blank" rel="noopener noreferrer" className={`${buttonClass} w-full`}>
            Send on WhatsApp
          </a>
          <div className="grid grid-cols-2 gap-3">
            <CopyButton text={url} />
            <a href={url} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
              See customer page
            </a>
          </div>
          <form action={cancelQuote.bind(null, quote.id)}>
            <button className="w-full py-2 text-sm text-muted-foreground underline">Withdraw quote</button>
          </form>
        </section>
      )}

      {status === "ACCEPTED" && quote.booking_id && (
        <p className="rounded-xl bg-primary-soft p-4 text-sm text-primary-ink">
          The customer accepted this quote, so it became booking{" "}
          <Link href={`/bookings/${quote.booking_id}`} className="font-semibold underline">
            {quote.bookings?.reference}
          </Link>
          . Accept the booking there to block the items on the calendar.
        </p>
      )}
    </>
  );
}
