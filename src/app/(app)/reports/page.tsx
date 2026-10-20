import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorNote, PageHeader, inputClass, secondaryButtonClass, upgradeBadgeClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { STATUS_LABEL, type BookingStatus } from "@/lib/bookings";
import { formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { METHOD_LABEL } from "@/lib/payments";
import { PERIODS, PERIOD_LABEL, readPeriod, type CsvSection, type Report } from "@/lib/reports";

function Section({
  title,
  note,
  csv,
  children,
}: {
  title: string;
  note?: string;
  csv?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {csv && (
          <a href={csv} className="shrink-0 text-xs font-medium text-primary underline">
            Download CSV
          </a>
        )}
      </div>
      {note && <p className="mb-2 text-xs text-muted-foreground">{note}</p>}
      {children}
    </section>
  );
}

function Row({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <li className={`flex justify-between gap-3 ${strong ? "border-t border-border pt-1 font-semibold" : ""}`}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0">{value}</span>
    </li>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-muted-foreground">{children}</p>;

/** Reports (FR-RP-01) for the chosen period, each section downloadable as CSV. */
export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const params = await searchParams;
  const { from, to, key } = readPeriod(params);
  const { supabase, business } = await requireBusiness();

  const { data: report, error } = await supabase.rpc("business_report", {
    p_business_id: business.id,
    p_from: from,
    p_to: to,
  });
  const r = report as Report | null;
  const csv = (section: CsvSection) =>
    r?.full ? `/reports/csv?${new URLSearchParams({ section, from, to })}` : undefined;

  return (
    <>
      <PageHeader title="Reports" />

      <nav className="mb-3 flex flex-wrap gap-2 text-sm">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/reports?period=${p}`}
            className={`rounded-full border px-3 py-1 ${p === key ? "border-primary bg-primary-soft font-medium text-primary-ink" : "border-input text-foreground-soft"}`}
          >
            {PERIOD_LABEL[p]}
          </Link>
        ))}
      </nav>
      <form method="get" className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <label className="min-w-0">
          <span className="mb-1 block text-xs text-muted-foreground">From</span>
          <input type="date" name="from" defaultValue={from} required className={`${inputClass} min-w-0`} />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-xs text-muted-foreground">To</span>
          <input type="date" name="to" defaultValue={to} required className={`${inputClass} min-w-0`} />
        </label>
        <button className={`${secondaryButtonClass} col-span-2`}>Show these dates</button>
      </form>

      <ErrorNote message={error?.message} />

      {r && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">{formatRange(r.from, r.to)} ({r.days} days)</p>

          <Section title="Money recorded" note="Payments you recorded with a date in this period." csv={csv("revenue")}>
            <ul className="space-y-1">
              <Row label="Rental received" value={formatNad(r.revenue.rental_received)} />
              {r.revenue.refunded > 0 && <Row label="Refunded" value={`−${formatNad(r.revenue.refunded)}`} />}
              {r.revenue.deposits_kept > 0 && <Row label="Kept from deposits" value={formatNad(r.revenue.deposits_kept)} />}
              <Row
                label="Total"
                value={<span className="rounded-md bg-accent px-2 py-0.5 text-accent-foreground">{formatNad(r.revenue.total)}</span>}
                strong
              />
            </ul>
            {r.revenue.by_method.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {r.revenue.by_method.map((m) => `${METHOD_LABEL[m.method]} ${formatNad(m.amount)}`).join(" · ")}
              </p>
            )}
          </Section>

          <Section title="Bookings" note="Bookings starting in this period.">
            <ul className="space-y-1">
              <Row label="Went ahead" value={r.bookings.went_ahead} />
              <Row label="Value of those bookings" value={formatNad(r.bookings.value)} />
              {Object.entries(r.bookings.by_status).map(([status, n]) => (
                <Row key={status} label={<span className="text-muted-foreground">{STATUS_LABEL[status as BookingStatus]}</span>} value={n} />
              ))}
              <Row label="All bookings" value={r.bookings.count} strong />
            </ul>
          </Section>

          {r.full ? (
            <>
            <Section
              title="Item use"
              note="Share of each item's units in service that were booked, day by day, in this period."
              csv={csv("items")}
            >
              {r.items.length === 0 ? (
                <Empty>No items yet.</Empty>
              ) : (
                <ul className="space-y-2">
                  {r.items.map((i) => (
                    <li key={i.name}>
                      <p className="flex justify-between gap-3">
                        <span>{i.name}</span>
                        <span className="font-medium">{i.utilisation}%</span>
                      </p>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(i.utilisation, 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Still owed" note="Right now, on bookings that went ahead." csv={csv("outstanding")}>
              {r.outstanding.length === 0 ? (
                <Empty>Nothing is owed.</Empty>
              ) : (
                <ul className="space-y-1">
                  {r.outstanding.map((o) => (
                    <Row
                      key={o.id}
                      label={<Link href={`/bookings/${o.id}`} className="underline">{o.customer} · {o.reference}</Link>}
                      value={<span className="text-danger">{formatNad(o.amount)}</span>}
                    />
                  ))}
                  <Row
                    label="Total"
                    value={<span className="text-danger">{formatNad(r.outstanding.reduce((s, o) => s + Number(o.amount), 0))}</span>}
                    strong
                  />
                </ul>
              )}
            </Section>

            <Section title="Deposits held" note="Right now: received and not yet returned or kept." csv={csv("deposits")}>
              {r.deposits_held.length === 0 ? (
                <Empty>No deposits held.</Empty>
              ) : (
                <ul className="space-y-1">
                  {r.deposits_held.map((d) => (
                    <Row
                      key={d.id}
                      label={<Link href={`/bookings/${d.id}`} className="underline">{d.customer} · {d.reference}</Link>}
                      value={formatNad(d.amount)}
                    />
                  ))}
                  <Row label="Total" value={formatNad(r.deposits_held.reduce((s, d) => s + Number(d.amount), 0))} strong />
                </ul>
              )}
            </Section>

            <Section title="Top customers" note="By the value of their bookings starting in this period." csv={csv("customers")}>
              {r.top_customers.length === 0 ? (
                <Empty>No bookings in this period.</Empty>
              ) : (
                <ol className="space-y-1">
                  {r.top_customers.map((c) => (
                    <li key={c.phone} className="flex justify-between gap-3">
                      <span>
                        {c.name} <span className="text-muted-foreground">({c.bookings} booking{c.bookings > 1 ? "s" : ""})</span>
                      </span>
                      <span>{formatNad(c.value)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Section>
            </>
          ) : (
            <section className="mb-4 rounded-xl border border-accent-border bg-accent-soft p-4 text-sm text-accent-ink">
              <p className="font-semibold">More reports with Pro and Business</p>
              <p className="mt-1">
                See how much each item is used, who still owes you, the deposits you hold and your top customers, and
                download every report as a CSV file for Excel.
              </p>
              <Link href="/plan" className={`mt-3 ${upgradeBadgeClass}`}>Upgrade to see more</Link>
            </section>
          )}
        </>
      )}
    </>
  );
}
