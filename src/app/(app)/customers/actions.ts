"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyError, requireBusiness } from "@/lib/business";

export async function updateCustomer(id: string, formData: FormData) {
  const { supabase } = await requireBusiness();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const back = `/customers/${id}`;
  if (!fullName || !phone) redirect(`${back}?error=${encodeURIComponent("Enter a name and phone number")}`);

  const { error } = await supabase
    .from("customers")
    .update({ full_name: fullName, phone, notes: String(formData.get("notes") ?? "").trim() || null })
    .eq("id", id);

  if (error) {
    const message = error.code === "23505" ? "Another customer already has that phone number" : friendlyError(error);
    redirect(`${back}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/customers");
  redirect(`${back}?saved=1`);
}
