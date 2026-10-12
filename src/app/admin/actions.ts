"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readLimit, requireAdmin } from "@/lib/admin";
import { friendlyError } from "@/lib/business";

function back(error?: { message: string } | null, saved?: string): never {
  if (error) redirect(`/admin?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/admin");
  redirect(saved ? `/admin?saved=${saved}` : "/admin");
}

/** FR-PL-03: approve a proof of payment (plan on for 12 months) or reject it with a reason. */
export async function reviewPayment(paymentId: string, approve: boolean, formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("review_plan_payment", {
    p_payment_id: paymentId,
    p_approve: approve,
    p_note: String(formData.get("note") ?? ""),
  });
  back(error, approve ? "approved" : "rejected");
}

/** Plan prices and limits are admin settings (SRS 3.2). */
export async function updatePlan(code: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("plans")
    .update({
      yearly_price: Number(formData.get("yearly_price")),
      founding_price: Number(formData.get("founding_price")),
      item_limit: readLimit(formData.get("item_limit")),
      user_limit: readLimit(formData.get("user_limit")),
      booking_fee_rate: Number(formData.get("booking_fee_percent")) / 100,
      full_reports: formData.get("full_reports") === "on",
    })
    .eq("code", code);
  back(error, "plan");
}

export async function updatePlatformSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      launch_ends_on: text("launch_ends_on"),
      seller_name: text("seller_name"),
      seller_address: text("seller_address"),
      seller_vat_number: text("seller_vat_number") || null,
      bank_details: text("bank_details"),
      ewallet_details: text("ewallet_details"),
    })
    .eq("id", true);
  back(error, "settings");
}
