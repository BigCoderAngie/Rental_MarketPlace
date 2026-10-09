"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBusiness(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const towns = String(formData.get("towns") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!name) redirect("/setup?error=Enter+your+business+name");

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_business", { p_name: name, p_towns: towns });
  if (error) redirect(`/setup?error=${encodeURIComponent(error.message)}`);

  redirect("/inventory/new");
}
