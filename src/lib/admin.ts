import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Platform admins only (SRS 5.13, FR-AD-01). Everyone else gets a 404. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) notFound();
  return { supabase };
}

/** "" means no limit. */
export function readLimit(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}
