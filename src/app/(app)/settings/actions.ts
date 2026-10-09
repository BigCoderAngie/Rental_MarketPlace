"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyError, requireBusiness } from "@/lib/business";

export async function updateBusiness(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;

  const { data, error } = await supabase
    .from("businesses")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      towns: String(formData.get("towns") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      phone: text("phone"),
      whatsapp: text("whatsapp"),
      quote_validity_days: Number(formData.get("quote_validity_days") || 7),
      request_expiry_hours: Number(formData.get("request_expiry_hours") || 24),
      payment_terms: text("payment_terms"),
      terms: text("terms"),
    })
    .eq("id", business.id)
    .select("id");

  if (error) redirect(`/settings?error=${encodeURIComponent(friendlyError(error))}`);
  // Row level security lets only owners save; staff get no rows back.
  if (!data?.length) redirect("/settings?error=Only+the+business+owner+can+change+these+details");

  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}
