"use server";

import { redirect } from "next/navigation";
import { hasErrors, validateOwnerTerms } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

export type OwnerSetupState = { errors?: Record<string, string>; message?: string };

/**
 * "Before you list": saves the owner questions and the booking fee tick once
 * (rule 16, acknowledge_owner_terms in 20261024000000_owner_terms.sql), then
 * opens List an item.
 */
export async function saveOwnerSetup(_prev: OwnerSetupState, formData: FormData): Promise<OwnerSetupState> {
  const terms = {
    ownerKind: String(formData.get("ownerKind") ?? ""),
    businessName: String(formData.get("businessName") ?? "").trim(),
    feeAcknowledged: formData.get("feeAcknowledged") === "on",
  };
  const errors = validateOwnerTerms(terms);
  if (hasErrors(errors)) return { errors };

  const supabase = await createClient();
  const { error } = await supabase.rpc("acknowledge_owner_terms", { p_owner_kind: terms.ownerKind, p_business_name: terms.businessName || null });
  if (error) return { message: error.message };
  redirect(ROUTES.listItem);
}
