"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readLines } from "@/lib/availability";
import { readReturnLines } from "@/lib/handovers";
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

// FR-PY-01 / FR-PY-02: record money the business received, paid back, or kept.
export async function recordPayment(bookingId: string, formData: FormData) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.rpc("record_payment", {
    p_booking_id: bookingId,
    p_kind: String(formData.get("kind") ?? "RENTAL"),
    p_amount: Number(formData.get("amount") || 0),
    p_method: String(formData.get("method") ?? "cash"),
    p_paid_on: String(formData.get("paid_on") ?? "") || null,
    p_note: String(formData.get("note") ?? "").trim() || null,
  });

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  redirect(
    error
      ? `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}#money`
      : `/bookings/${bookingId}#money`,
  );
}

export async function voidPayment(bookingId: string, paymentId: string, formData: FormData) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.rpc("void_payment", {
    p_payment_id: paymentId,
    p_reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  redirect(
    error
      ? `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}#money`
      : `/bookings/${bookingId}#money`,
  );
}

function backToBooking(bookingId: string, error?: { message: string } | null): never {
  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath(`/bookings/${bookingId}`);
  redirect(error ? `/bookings/${bookingId}?error=${encodeURIComponent(error.message)}` : `/bookings/${bookingId}`);
}

// FR-CR-01 / FR-CR-03: counts handed over, condition photos, ID checked.
export async function recordCheckout(bookingId: string, formData: FormData) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.rpc("record_checkout", {
    p_booking_id: bookingId,
    p_lines: readLines(formData),
    p_id_checked: formData.get("id_checked") === "on",
    p_photo_paths: formData.getAll("photo").map(String),
    p_note: String(formData.get("note") ?? "").trim() || null,
  });
  backToBooking(bookingId, error);
}

// FR-CR-04: per item, how many came back fine, damaged or missing.
export async function recordReturn(bookingId: string, formData: FormData) {
  const { supabase } = await requireBusiness();
  const { error } = await supabase.rpc("record_return", {
    p_booking_id: bookingId,
    p_lines: readReturnLines(formData),
    p_photo_paths: formData.getAll("photo").map(String),
    p_note: String(formData.get("note") ?? "").trim() || null,
  });
  backToBooking(bookingId, error);
}
