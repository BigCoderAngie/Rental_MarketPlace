"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyError, requireBusiness } from "@/lib/business";

/** FR-PL-03: send proof of a bank deposit or eWallet payment for Pro or Business. */
export async function requestPlan(planCode: string, formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.rpc("request_plan", {
    p_business_id: business.id,
    p_plan_code: planCode,
    p_method: String(formData.get("method") ?? "bank_deposit"),
    p_reference: String(formData.get("reference") ?? ""),
    p_proof_path: String(formData.get("proof_path") ?? ""),
  });
  if (error) redirect(`/plan/pay?plan=${planCode}&error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/plan");
  redirect("/plan?sent=1");
}
