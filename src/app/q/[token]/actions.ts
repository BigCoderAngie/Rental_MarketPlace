"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The customer accepts from the quote link, without an account (FR-AC-04).
export async function acceptQuote(token: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_public_quote", {
    p_token: token,
    p_customer_name: String(formData.get("customer_name") ?? ""),
    p_customer_phone: String(formData.get("customer_phone") ?? ""),
  });

  redirect(error ? `/q/${token}?error=${encodeURIComponent(error.message)}` : `/q/${token}`);
}
