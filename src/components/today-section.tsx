import Link from "next/link";
import { focusRingClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { TODAY_FILTERS, TODAY_LABEL, type TodaySummary } from "@/lib/today";

/** Four cards at the top of the calendar; each opens the matching bookings. */
export function TodaySection({ summary }: { summary: TodaySummary | null }) {
  if (!summary) {
    return (
      <p className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Couldn&apos;t load today&apos;s summary. Refresh the page to try again.
      </p>
    );
  }
  const counts = TODAY_FILTERS.map((f) => summary.ids[f].length);
  const nothing = counts.every((n) => n === 0);

  return (
    <section aria-labelledby="today-title" className="mb-6">
      <h2 id="today-title" className="mb-2 text-sm font-semibold text-foreground-soft">
        Today, {formatDate(summary.today)}
      </h2>
      {nothing ? (
        <p className="rounded-xl border border-border bg-card p-4">
          <span className="block font-medium">Nothing going out or coming back today</span>
          <span className="block text-sm text-muted-foreground">No overdue returns and no money owed.</span>
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TODAY_FILTERS.map((filter, i) => (
            <li key={filter}>
              <Link
                href={`/bookings?filter=${filter}`}
                className={`flex h-full min-h-24 flex-col rounded-xl border border-border bg-card p-3 hover:bg-background ${focusRingClass}`}
              >
                <span
                  className={`text-3xl font-semibold leading-none ${
                    filter !== "overdue" ? "text-primary" : counts[i] > 0 ? "text-danger" : "text-muted-foreground"
                  }`}
                >
                  {counts[i]}
                </span>
                {filter === "out-today" && summary.latePickups > 0 && (
                  <span className="mt-1 text-sm font-medium text-danger">({summary.latePickups} late)</span>
                )}
                <span className="mt-2 text-sm font-medium">{TODAY_LABEL[filter]}</span>
                {filter === "owed" && counts[i] > 0 && (
                  <span className="text-sm text-muted-foreground">{formatNad(summary.owedTotal)}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
