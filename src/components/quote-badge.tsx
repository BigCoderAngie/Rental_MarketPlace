import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, type QuoteStatus } from "@/lib/quotes";

export function QuoteBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${QUOTE_STATUS_TONE[status]}`}>
      {QUOTE_STATUS_LABEL[status]}
    </span>
  );
}
