"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// FR-PY-04: the customer confirms a payment the business recorded.
export async function confirmPayment(token: string, paymentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_public_payment", {
    p_token: token,
    p_payment_id: paymentId,
  });

  redirect(error ? `/b/${token}?error=${encodeURIComponent(error.message)}` : `/b/${token}`);
}
