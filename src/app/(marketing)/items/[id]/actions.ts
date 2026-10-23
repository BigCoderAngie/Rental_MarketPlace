"use server";

import { redirect } from "next/navigation";
import { requestErrorMessage } from "@/lib/requests";
import { createClient } from "@/lib/supabase/server";

export type SendState = { message?: string };

/**
 * Send request (build kit Part 6). Visitors sign up first and come back to the
 * item with their dates (rule 20). The database checks the dates, stock and
 * minimum days again and sets the 24-hour expiry (send_request).
 */
export async function sendRequest(_prev: SendState, formData: FormData): Promise<SendState> {
  const itemId = String(formData.get("itemId") ?? "");
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    const back = `/items/${itemId}?${new URLSearchParams({ from, to })}`;
    redirect(`/join?${new URLSearchParams({ next: back })}`);
  }

  const { error } = await supabase.rpc("send_request", { p_item_id: itemId, p_from: from, p_to: to, p_quantity: quantity });
  if (error) return { message: requestErrorMessage(error) };
  redirect("/my/bookings?sent=1");
}
