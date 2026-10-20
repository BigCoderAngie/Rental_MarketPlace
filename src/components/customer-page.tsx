import type { ReactNode } from "react";
import { formatDays } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import type { SummaryRow } from "@/lib/price-summary";

// Shared pieces for the pages customers open from WhatsApp: the quote (/q)
// and the booking (/b). Kept light for mobile data: no background images,
// photos load lazily at a fixed small size.

/** Green band at the top with the business name and the towns it serves. */
export function BusinessHeader({ eyebrow, name, towns }: { eyebrow: string; name: string; towns: string[] }) {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-lg px-4 pb-6 pt-5">
        <p className="text-sm text-primary-soft">{eyebrow}</p>
        <h1 className="mt-0.5 text-2xl font-semibold leading-tight">{name}</h1>
        {towns.length > 0 && <p className="mt-1 text-sm text-primary-soft">{towns.join(", ")}</p>}
      </div>
    </header>
  );
}

type Line = { name: string; quantity: number; daily_price: number };

/** Everything on the quote or booking, packages first, as cards. Items without a photo get a placeholder. */
export function LineCards({
  packages,
  items,
  days,
  photoUrl,
}: {
  packages: (Line & { contents?: string })[];
  items: (Line & { photo_path?: string | null })[];
  days: number;
  photoUrl?: (path: string | null | undefined) => string | null;
}) {
  const breakdown = (l: Line) => `${l.quantity} × ${formatNad(l.daily_price)} a day × ${formatDays(days)}`;
  return (
    <ul className="space-y-2">
      {packages.map((p, i) => (
        <LineCard
          key={`pkg-${i}`}
          name={p.name}
          quantity={p.quantity}
          price={p.quantity * p.daily_price * days}
          detail={p.contents || breakdown(p)}
        />
      ))}
      {items.map((item) => (
        <LineCard
          key={item.name}
          name={item.name}
          quantity={item.quantity}
          price={item.quantity * item.daily_price * days}
          detail={breakdown(item)}
          photoUrl={photoUrl?.(item.photo_path)}
        />
      ))}
    </ul>
  );
}

/** One item or package: photo (or a cream placeholder), name, quantity and line price. */
function LineCard({
  name,
  quantity,
  price,
  detail,
  photoUrl,
}: {
  name: string;
  quantity: number;
  price: number;
  detail?: string;
  photoUrl?: string | null;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL
        <img
          src={photoUrl}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-background">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M3 19L12 5l9 14H3z" />
            <path d="M12 19v-6l-3 6M12 13l3 6" />
          </svg>
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{name}</span>
        <span className="block text-sm text-muted-foreground">Quantity: {quantity}</span>
        {detail && <span className="block text-xs text-muted-foreground">{detail}</span>}
      </span>
      <span className="shrink-0 font-semibold">{formatNad(price)}</span>
    </li>
  );
}

/** The money summary: extra fees and discount, then the totals. */
export function TotalsBox({ rows, children }: { rows: SummaryRow[]; children?: ReactNode }) {
  return (
    <section aria-label="Totals" className="rounded-xl border border-border bg-card p-4">
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex justify-between gap-3 ${
              r.tone === "strong" ? "border-t border-border pt-2 text-base font-semibold first:border-t-0 first:pt-0" : r.tone === "quiet" ? "text-muted-foreground" : ""
            }`}
          >
            <dt>{r.label}</dt>
            <dd className="shrink-0">
              {r.minus ? "−" : ""}
              {formatNad(r.amount)}
            </dd>
          </div>
        ))}
      </dl>
      {children}
    </section>
  );
}
