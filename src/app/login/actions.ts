"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Phase 1 signs in with an email code. The SRS asks for phone codes
// (FR-AC-01); switch to signInWithOtp({ phone }) once an SMS provider is set
// up in Supabase.

export async function sendCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?error=Enter+your+email");

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  const params = new URLSearchParams({ email });
  if (error) params.set("error", error.message);
  else params.set("sent", "1");
  redirect(`/login?${params}`);
}

export async function verifyCode(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    redirect(`/login?${new URLSearchParams({ email, sent: "1", error: error.message })}`);
  }
  redirect("/calendar");
}
