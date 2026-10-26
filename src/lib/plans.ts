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

/** Free, Pro and Business in display order. Signed-out visitors can read these too (the homepage). */
export async function loadPlans(supabase: SupabaseClient): Promise<Plan[]> {
  const { data, error } = await supabase.from("plans").select("*").order("sort_order").returns<Plan[]>();
  if (error) console.error("Could not load plans:", error.message);
  return data ?? [];
}

/**
 * The last day a new business gets founding prices (YYYY-MM-DD). Signed-out
 * visitors can read this one setting too; null if it could not be loaded.
 */
export async function loadLaunchEndsOn(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("launch_ends_on")
    .maybeSingle<Pick<PlatformSettings, "launch_ends_on">>();
  if (error) console.error("Could not load the launch date:", error.message);
  return data?.launch_ends_on ?? null;
}

/** The plan in force, the subscription row behind it, and today's prices. */
export async function loadPlan(supabase: SupabaseClient, businessId: string) {
  const [{ data: plan }, { data: subscription }, plans] = await Promise.all([
    supabase.rpc("business_plan", { p_business_id: businessId }).single<Plan>(),
    supabase.from("subscriptions").select("*").eq("business_id", businessId).maybeSingle<Subscription>(),
    loadPlans(supabase),
  ]);
  return { plan: plan ?? null, subscription: subscription ?? null, plans };
}

/** What this business pays for a year of a plan today (mirrors plan_price() in the database). */
export function priceFor(plan: Plan, subscription: Pick<Subscription, "founding_until"> | null, today: string): number {
  const founding = subscription?.founding_until != null && today <= subscription.founding_until;
  return Number(founding ? plan.founding_price : plan.yearly_price);
}

export function limitText(limit: number | null, noun: string): string {
  return limit == null ? `Unlimited ${noun}` : `Up to ${limit} ${noun}`;
}

/** What a plan includes, as shown on the plan page and the homepage. */
export function planFeatures(plan: Pick<Plan, "item_limit" | "user_limit" | "full_reports">): string[] {
  return [
    limitText(plan.item_limit, "items"),
    limitText(plan.user_limit, plan.user_limit === 1 ? "user" : "users"),
    plan.full_reports ? "Full reports and CSV downloads" : "Money and booking reports",
  ];
}

/**
 * Whether the launch is still on (founding prices, 0% booking fee). The database
 * decides on the UTC date (plan_price()), so compare the same date.
 */
export function launchIsOn(launchEndsOn: string | null, now = new Date()): boolean {
  return launchEndsOn != null && now.toISOString().slice(0, 10) <= launchEndsOn;
}

/** The plan's marketplace booking fee; 0% for everyone while the launch is on (SRS 3.1). */
export function bookingFeeText(plan: Pick<Plan, "booking_fee_rate">, launchOn: boolean): string {
  const percent = Math.round(Number(plan.booking_fee_rate) * 100);
  if (percent === 0) return "Marketplace booking fee 0%";
  return launchOn ? `Marketplace booking fee ${percent}% after the launch, 0% until then` : `Marketplace booking fee ${percent}%`;
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
