"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateListing, type ListingInput } from "@/lib/listing";
import { hasErrors } from "@/lib/signup";
import { createClient } from "@/lib/supabase/server";

export type ListingState = { errors?: Record<string, string>; message?: string };

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

/**
 * Publish my listing / Save as draft (build kit Part 9). The owner's business
 * is made on the first listing (ensure_owner_business). Photos were uploaded
 * from the phone already; only their paths arrive here, and the database
 * checks they sit in this business's folder. The Free plan's 15-item limit
 * is checked by the database too.
 */
export async function saveListing(_prev: ListingState, formData: FormData): Promise<ListingState> {
  const publish = text(formData, "intent") !== "draft";
  const input: ListingInput = {
    category: text(formData, "category"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    condition: text(formData, "condition"),
    price: text(formData, "price"),
    deposit: text(formData, "deposit"),
    minDays: text(formData, "minDays"),
    quantity: text(formData, "quantity"),
    town: text(formData, "town"),
    area: text(formData, "area"),
    street: text(formData, "street"),
    photos: formData.getAll("photo").map(String).filter(Boolean),
  };
  const { errors, values } = validateListing(input, publish);
  if (hasErrors(errors)) return { errors, message: "Some details need fixing before you can continue." };

  const supabase = await createClient();
  const { data: businessId, error: businessError } = await supabase.rpc("ensure_owner_business");
  if (businessError) return { message: businessError.message };

  // Renters search by town, so the owner's business serves the collection town.
  const { data: business } = await supabase.from("businesses").select("towns").eq("id", businessId as string).single<{ towns: string[] }>();
  if (business && values.town !== "Other" && !business.towns.includes(values.town)) {
    await supabase.from("businesses").update({ towns: [...business.towns, values.town] }).eq("id", businessId as string);
  }

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      business_id: businessId,
      name: values.name,
      category: values.category,
      description: values.description,
      condition: values.condition,
      daily_price: values.daily_price,
      deposit: values.deposit,
      min_days: values.min_days,
      quantity_owned: values.quantity_owned,
      area: values.area || null,
      street_address: values.street_address,
      photo_path: values.photo_path,
      gallery_paths: values.gallery_paths,
      is_public: publish,
      listed_at: publish ? new Date().toISOString() : null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error) return { message: error.hint === "plan_limit" ? error.message : `Your listing wasn't saved: ${error.message}` };

  revalidatePath("/owner", "layout");
  revalidatePath("/explore");
  redirect(publish ? `/items/${item.id}?listed=1` : "/owner?draft=1");
}
