"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Cancel request: only while the owner hasn't answered yet. */
export async function cancelRequest(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_request", { p_request_id: String(formData.get("id") ?? "") });
  if (error) redirect(`/my/bookings?${new URLSearchParams({ error: error.message })}`);
  revalidatePath("/my/bookings");
  redirect("/my/bookings?cancelled=1");
}
