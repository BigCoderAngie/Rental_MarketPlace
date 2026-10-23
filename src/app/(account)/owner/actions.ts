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

/** Publish a draft from the dashboard; the database checks it has a price and an area first. */
export async function publishDraft(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.rpc("publish_listing", { p_item_id: id });
  if (error) redirect(`/owner?${new URLSearchParams({ error: error.message })}`);
  revalidatePath("/owner", "layout");
  revalidatePath("/explore");
  redirect(`/items/${id}?listed=1`);
}
