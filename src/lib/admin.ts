import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Whether the signed-in user is a platform admin. Cached, so the layout and page share one check per request. */
export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return Boolean(data);
});

/** Platform admins only (SRS 5.13, FR-AD-01). Everyone else gets a 404. */
export async function requireAdmin() {
  if (!(await isPlatformAdmin())) notFound();
  return { supabase: await createClient() };
}

/** "" means no limit. */
export function readLimit(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}
