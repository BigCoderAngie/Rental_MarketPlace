"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** "Run a hire business?": turns the owner's individual account into a hire business, which adds the business tools. */
export async function becomeHireBusiness() {
  const supabase = await createClient();
  const { data: id } = await supabase.rpc("ensure_owner_business");
  const { error } = await supabase.from("businesses").update({ kind: "business" }).eq("id", id as string);
  if (error) redirect(`/owner?${new URLSearchParams({ error: error.message })}`);
  revalidatePath("/owner", "layout");
  redirect("/settings");
}
