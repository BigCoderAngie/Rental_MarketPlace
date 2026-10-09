// Payment records (SRS 5.7). Money is paid to the business directly; the app
// only records it. Balances come from the booking_balances view.

export const PAYMENT_KINDS = ["RENTAL", "DEPOSIT_RECEIVED", "DEPOSIT_RETURNED", "DEPOSIT_DEDUCTED", "REFUND"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_METHODS = ["cash", "eft", "ewallet", "card", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const KIND_LABEL: Record<PaymentKind, string> = {
  RENTAL: "Payment received",
  DEPOSIT_RECEIVED: "Deposit received",
  DEPOSIT_RETURNED: "Deposit returned",
  DEPOSIT_DEDUCTED: "Kept from deposit",
  REFUND: "Refund paid",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  eft: "EFT",
  ewallet: "eWallet",
  card: "Card",
  other: "Other",
};

/** Money going back to the customer reads as negative in the list. */
export function isOutgoing(kind: PaymentKind): boolean {
  return kind === "REFUND" || kind === "DEPOSIT_RETURNED";
}

export type Payment = {
  id: string;
  kind: PaymentKind;
  amount: number;
  method: PaymentMethod | null;
  paid_on: string;
  note: string | null;
  customer_confirmed_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
};

export type Balance = {
  amount_due: number;
  amount_paid: number;
  outstanding: number;
  deposit_received: number;
  deposit_held: number;
};

/** "Paid", "Part paid" or "Unpaid", for lists. */
export function paymentState(b: Pick<Balance, "amount_due" | "amount_paid" | "outstanding">) {
  if (Number(b.amount_due) > 0 && Number(b.outstanding) <= 0) return "Paid";
  if (Number(b.amount_paid) > 0) return "Part paid";
  return "Unpaid";
}
