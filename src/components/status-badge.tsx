import type { ReactNode } from "react";
import type { BadgeTone } from "@/lib/badge-tones";
import { STATUS_LABEL, STATUS_TONE, type BookingStatus } from "@/lib/bookings";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, type QuoteStatus } from "@/lib/quotes";

// The one badge for statuses and flags. Every badge shows a word, never only
// a colour. All text is at least 4.5:1 on its background.
const TONE_CLASS: Record<BadgeTone, string> = {
  accent: "border-transparent bg-accent text-accent-foreground", // 7.4:1
  primary: "border-transparent bg-primary text-primary-foreground", // 6.1:1
  "primary-outline": "border-primary bg-card text-primary", // 6.1:1
  danger: "border-transparent bg-danger text-danger-foreground", // 5.3:1
  muted: "border-transparent bg-muted text-muted-foreground", // 5.0:1
};

export function Badge({ tone, className = "", children }: { tone: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function QuoteBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={QUOTE_STATUS_TONE[status]}>{QUOTE_STATUS_LABEL[status]}</Badge>;
}
