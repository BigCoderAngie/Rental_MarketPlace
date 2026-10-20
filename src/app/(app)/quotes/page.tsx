import Link from "next/link";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { QuoteBadge } from "@/components/status-badge";
import { requireBusiness } from "@/lib/business";
import { formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { effectiveQuoteStatus, quoteTotals } from "@/lib/quotes";
import type { Quote } from "@/lib/types";

type Row = Quote & { quote_items: { quantity: number; package_units: number; daily_price: number }[]; quote_packages: { quantity: number; daily_price: number }[] };

export default async function QuotesPage() {
  const { supabase, business } = await requireBusiness();
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*, quote_items(quantity, package_units, daily_price), quote_packages(quantity, daily_price)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<Row[]>();
  if (error) throw error;

  return (
    <>
      <PageHeader title="Quotes" action={<LinkButton href="/quotes/new">New quote</LinkButton>} />

      {quotes.length === 0 ? (
        <EmptyState
          message="Quotes you send on WhatsApp go here. Customers accept them straight from the link."
          actionHref="/quotes/new"
          actionLabel="Create your first quote"
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {quotes.map((q) => (
            <li key={q.id}>
              <Link href={`/quotes/${q.id}`} className="block px-4 py-3">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{q.customer_name}</span>
                  <QuoteBadge status={effectiveQuoteStatus(q.status, q.expires_at)} />
                </span>
                <span className="block text-sm text-muted-foreground">
                  {formatRange(q.start_date, q.end_date)} · {formatNad(quoteTotals({ ...q, lines: q.quote_items, packages: q.quote_packages }).total)} · {q.reference}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
