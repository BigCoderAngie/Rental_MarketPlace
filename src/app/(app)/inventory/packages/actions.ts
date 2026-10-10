"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readLines } from "@/lib/availability";
import { friendlyError, requireBusiness } from "@/lib/business";

async function save(packageId: string | null, formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const { error } = await supabase.rpc("save_package", {
    p_business_id: business.id,
    p_package_id: packageId,
    p_name: String(formData.get("name") ?? ""),
    p_description: String(formData.get("description") ?? ""),
    p_daily_price: Number(formData.get("daily_price") ?? 0),
    p_lines: readLines(formData),
  });

  if (error) {
    const back = packageId ? `/inventory/packages/${packageId}` : "/inventory/packages/new";
    redirect(`${back}?error=${encodeURIComponent(friendlyError(error))}`);
  }
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function createPackage(formData: FormData) {
  await save(null, formData);
}

export async function updatePackage(id: string, formData: FormData) {
  await save(id, formData);
}

export async function archivePackage(id: string) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.rpc("archive_package", { p_package_id: id });

  if (error) redirect(`/inventory/packages/${id}?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/inventory");
  redirect("/inventory");
}
