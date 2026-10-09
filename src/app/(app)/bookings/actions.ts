"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readLines } from "@/lib/availability";
import { requireBusiness } from "@/lib/business";
import type { BookingStatus } from "@/lib/bookings";
import type { Booking } from "@/lib/types";

export async function createBooking(formData: FormData) {
  const { supabase, business } = await requireBusiness();
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");

  const lines = readLines(formData);

  const back = (error: string) =>
    redirect(`/bookings/new?${new URLSearchParams({ start, end, error })}`);

  if (lines.length === 0) back("Enter a quantity for at least one item");

  const { data, error } = await supabase
    .rpc("create_booking", {
      p_business_id: business.id,
      p_customer_name: String(formData.get("customer_name") ?? ""),
      p_customer_phone: String(formData.get("customer_phone") ?? ""),
      p_start_date: start,
      p_end_date: end,
      p_lines: lines,
      p_accept: formData.get("accept") === "on",
      p_notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .single<Booking>();

  if (error) back(error.message);
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  redirect(`/bookings/${data!.id}`);
}

export async function moveBooking(id: string, to: BookingStatus, formData: FormData) {
  const { supabase } = await requireBusiness();
  const note = String(formData.get("note") ?? "").trim() || null;

  const { error } =
    to === "ACCEPTED"
      ? await supabase.rpc("accept_booking", { p_booking_id: id, p_note: note })
      : to === "DECLINED"
        ? await supabase.rpc("decline_booking", { p_booking_id: id, p_reason: note })
        : to === "CANCELLED"
          ? await supabase.rpc("cancel_booking", { p_booking_id: id, p_reason: note ?? "" })
          : await supabase.rpc("set_booking_status", { p_booking_id: id, p_to: to, p_note: note });

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath(`/bookings/${id}`);
  redirect(error ? `/bookings/${id}?error=${encodeURIComponent(error.message)}` : `/bookings/${id}`);
}
