"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readLines } from "@/lib/availability";
import { readPackageLines } from "@/lib/packages";
import { requireBusiness } from "@/lib/business";
import type { Quote } from "@/lib/types";

export async function createQuote(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  const money = (key: string) => Number(formData.get(key) || 0);
  const lines = [...readPackageLines(formData), ...readLines(formData)];

  const back = (error: string) =>
    redirect(`/quotes/new?${new URLSearchParams({ start, end, error })}`);

  if (lines.length === 0) back("Enter a quantity for at least one item or package");

  const { data, error } = await supabase
    .rpc("create_quote", {
      p_business_id: business.id,
      p_customer_name: String(formData.get("customer_name") ?? ""),
      p_customer_phone: String(formData.get("customer_phone") ?? ""),
      p_start_date: start,
      p_end_date: end,
      p_lines: lines,
      p_delivery_fee: money("delivery_fee"),
      p_setup_fee: money("setup_fee"),
      p_discount: money("discount"),
      p_notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .single<Quote>();

  if (error) back(error.message);
  revalidatePath("/quotes");
  redirect(`/quotes/${data!.id}`);
}

export async function cancelQuote(id: string) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.rpc("cancel_quote", { p_quote_id: id });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(error ? `/quotes/${id}?error=${encodeURIComponent(error.message)}` : `/quotes/${id}`);
}
