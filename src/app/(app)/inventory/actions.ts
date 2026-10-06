"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyError, requireBusiness } from "@/lib/business";

function readItem(formData: FormData) {
  const num = (key: string) => Number(formData.get(key) ?? 0);
  const replacement = String(formData.get("replacement_value") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "other"),
    description: String(formData.get("description") ?? "").trim() || null,
    quantity_owned: num("quantity_owned"),
    units_out_of_service: num("units_out_of_service"),
    daily_price: num("daily_price"),
    deposit: num("deposit"),
    replacement_value: replacement === "" ? null : Number(replacement),
    turnaround_days: num("turnaround_days"),
    low_stock_threshold: num("low_stock_threshold"),
  };
}

export async function createItem(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase
    .from("items")
    .insert({ ...readItem(formData), business_id: business.id });

  if (error) redirect(`/inventory/new?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function updateItem(id: string, formData: FormData) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.from("items").update(readItem(formData)).eq("id", id);

  if (error) redirect(`/inventory/${id}?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function archiveItem(id: string) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.from("items").update({ archived: true }).eq("id", id);

  if (error) redirect(`/inventory/${id}?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/inventory");
  redirect("/inventory");
}
