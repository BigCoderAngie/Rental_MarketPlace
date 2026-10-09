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

// FR-CR-02 / FR-CR-05: the customer agrees with a checkout or return record,
// or disputes it with a note.
export async function respondToHandover(token: string, handoverId: string, agree: boolean, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_public_handover", {
    p_token: token,
    p_handover_id: handoverId,
    p_agree: agree,
    p_note: String(formData.get("note") ?? "").trim() || null,
  });

  redirect(error ? `/b/${token}?error=${encodeURIComponent(error.message)}` : `/b/${token}`);
}
