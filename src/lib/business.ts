import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";

/**
 * The signed-in user's business. Phase 1 assumes one business per user;
 * sends people without one to /setup.
 */
export async function requireBusiness() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, towns, phone, whatsapp, quote_validity_days, payment_terms, terms")
    .order("created_at")
    .limit(1)
    .maybeSingle<Business>();

  if (error) throw error;
  if (!data) redirect("/setup");
  return { supabase, business: data };
}

/** Turns a database error into a message staff can read. */
export function friendlyError(error: { message: string }): string {
  if (error.message.includes("violates check constraint")) {
    return "Check the numbers: they cannot be negative, and units out of service cannot exceed units owned.";
  }
  return error.message;
}
