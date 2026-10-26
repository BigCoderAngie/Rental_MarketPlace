import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether the signed-in person still has to answer the owner questions and
 * tick the booking fee box ("Before you list", rule 16) before listing.
 * Members of a hire business (owners and staff from before the one sign-up)
 * are never asked. Throws when the check itself fails.
 */
export async function needsOwnerSetup(supabase: SupabaseClient): Promise<boolean> {
  const { data: claims } = await supabase.auth.getClaims();
  const [{ data: profile, error: profileError }, { data: hire, error: hireError }] = await Promise.all([
    supabase.from("profiles").select("fee_acknowledged_at").eq("user_id", claims?.claims?.sub ?? "").maybeSingle<{ fee_acknowledged_at: string | null }>(),
    supabase.from("businesses").select("id").eq("kind", "business").limit(1),
  ]);
  if (profileError || hireError) throw new Error("We couldn't check your account. Try again.");
  return !profile?.fee_acknowledged_at && !hire?.length;
}
