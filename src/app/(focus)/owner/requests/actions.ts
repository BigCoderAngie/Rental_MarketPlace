"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestErrorMessage } from "@/lib/requests";
import { createClient } from "@/lib/supabase/server";

function back(params: Record<string, string>): never {
  revalidatePath("/owner", "layout");
  redirect(`/owner/requests?${new URLSearchParams(params)}`);
}

/**
 * Accept and pay the booking fee (rule 3). Payment runs in TEST mode until
 * PayToday is connected (build kit decision 2): no money moves, the request
 * gets a TEST reference, the units go on hold and both sides unlock.
 */
export async function acceptAndPay(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const item = String(formData.get("item") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_and_pay_request", { p_request_id: id });
  if (error) back({ item, r: id, error: requestErrorMessage(error) });
  back({ item, r: id, paid: "1" });
}

export async function declineRequest(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const item = String(formData.get("item") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_request", { p_request_id: id });
  if (error) back({ item, r: id, error: error.message });
  back({ item, declined: "1" });
}

/** Rule 4: the renter cancelled or didn't show; RentLoop reviews the claim and refunds the fee. */
export async function claimRefund(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const item = String(formData.get("item") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Renter didn't show";
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_fee_refund", { p_request_id: id, p_reason: reason });
  if (error) back({ item, r: id, error: error.message });
  back({ item, r: id, refund: "1" });
}
