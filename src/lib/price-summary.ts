// The money summary customers see on their quote and booking pages.

/** One line of the summary. "strong" rows are totals; "quiet" rows are for information. */
export type SummaryRow = { label: string; amount: number; minus?: boolean; tone?: "strong" | "quiet" };

/** Delivery, setup and discount lines, leaving out any that are zero. */
export function extraCharges(x: { delivery_fee: number; setup_fee: number; discount: number }): SummaryRow[] {
  const rows: SummaryRow[] = [
    { label: "Delivery", amount: x.delivery_fee },
    { label: "Setup", amount: x.setup_fee },
    { label: "Discount", amount: x.discount, minus: true },
  ];
  return rows.filter((row) => row.amount > 0);
}
