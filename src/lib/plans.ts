// Plans: Free, Pro and Business (SRS 3.2, FR-PL-01 to FR-PL-05). Prices,
// limits and the rules live in the database; this file reads and describes them.

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatNad } from "./money";

export type PlanCode = "free" | "pro" | "business";

export type Plan = {
  code: PlanCode;
  name: string;
  yearly_price: number;
  founding_price: number;
  item_limit: number | null;
  user_limit: number | null;
  booking_fee_rate: number;
  full_reports: boolean;
  sort_order: number;
};

export type Subscription = {
  business_id: string;
  plan_code: PlanCode;
  expires_at: string | null;
  founding_until: string | null;
};

export type PlanPaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PlanPayment = {
  id: string;
  business_id: string;
  plan_code: PlanCode;
  amount: number;
  method: "bank_deposit" | "ewallet";
  reference: string | null;
  proof_path: string;
  status: PlanPaymentStatus;
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
  invoice_number: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

export type PlatformSettings = {
  launch_ends_on: string;
  seller_name: string;
  seller_address: string;
  seller_vat_number: string | null;
  bank_details: string;
  ewallet_details: string;
};

export const PROOF_BUCKET = "payment-proofs";

export const METHOD_LABEL: Record<PlanPayment["method"], string> = {
  bank_deposit: "Bank deposit or EFT",
  ewallet: "eWallet",
};

/** The plan in force, the subscription row behind it, and today's prices. */
export async function loadPlan(supabase: SupabaseClient, businessId: string) {
  const [{ data: plan }, { data: subscription }, { data: plans }] = await Promise.all([
    supabase.rpc("business_plan", { p_business_id: businessId }).single<Plan>(),
    supabase.from("subscriptions").select("*").eq("business_id", businessId).maybeSingle<Subscription>(),
    supabase.from("plans").select("*").order("sort_order").returns<Plan[]>(),
  ]);
  return { plan: plan ?? null, subscription: subscription ?? null, plans: plans ?? [] };
}

/** What this business pays for a year of a plan today (mirrors plan_price() in the database). */
export function priceFor(plan: Plan, subscription: Pick<Subscription, "founding_until"> | null, today: string): number {
  const founding = subscription?.founding_until != null && today <= subscription.founding_until;
  return Number(founding ? plan.founding_price : plan.yearly_price);
}

export function limitText(limit: number | null, noun: string): string {
  return limit == null ? `Unlimited ${noun}` : `Up to ${limit} ${noun}`;
}

export function priceText(amount: number): string {
  return amount === 0 ? "Free" : `${formatNad(amount)} a year`;
}

const DAY = 86_400_000;

/**
 * The reminder to show across the app (FR-PL-04): from 30 days before a paid
 * plan ends, and for 30 days after it lapses to Free.
 */
export function planReminder(
  subscription: Pick<Subscription, "plan_code" | "expires_at"> | null,
  planName: string,
  now: Date = new Date(),
): { tone: "warn" | "ended"; text: string } | null {
  if (!subscription?.expires_at || subscription.plan_code === "free") return null;
  const ends = new Date(subscription.expires_at);
  const left = ends.getTime() - now.getTime();
  const days = Math.round(left / DAY);
  const date = ends.toLocaleDateString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium" });
  if (left > 0 && days <= 30) {
    const until = days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`;
    return { tone: "warn", text: `Your ${planName} plan ends ${until} (${date}). Renew to keep it.` };
  }
  if (left <= 0 && left > -30 * DAY) {
    return { tone: "ended", text: `Your ${planName} plan ended on ${date}, so you're on Free now. Nothing was deleted.` };
  }
  return null;
}
