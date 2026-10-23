"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { homeAfterSignIn } from "@/lib/business";
import { MIN_PASSWORD_LENGTH, safeNextPath } from "@/lib/signup";
import { createClient } from "@/lib/supabase/server";

// Sign in with email and password (build kit Part 4; MASTER-PLAN build kit
// decision 3 as changed on 23 October 2026). The email code stays as a second
// way in, for accounts made before passwords and for anyone who prefers it.
// Problems come back as ?error= on the same page, like the old /login page.

function back(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params)}`);
}

function emailFrom(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

async function goHome(supabase: Awaited<ReturnType<typeof createClient>>, next: FormDataEntryValue | null): Promise<never> {
  redirect(safeNextPath(typeof next === "string" ? next : null) ?? (await homeAfterSignIn(supabase)));
}

export async function signInWithPassword(formData: FormData) {
  const email = emailFrom(formData);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) back("/signin", { email, error: "Enter your email and password." });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "invalid_credentials"
        ? "That email and password don't match. Try again, or use Forgot password."
        : error.code === "email_not_confirmed"
          ? "Confirm your email first: open the link we sent you."
          : error.message;
    back("/signin", { email, error: message });
  }
  await goHome(supabase, formData.get("next"));
}

export async function sendCode(formData: FormData) {
  const email = emailFrom(formData);
  if (!email) back("/signin/code", { error: "Enter your email." });

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  // Only existing accounts: new people sign up through /join so they agree to the terms first.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: false },
  });
  if (error) back("/signin/code", { email, error: error.code === "otp_disabled" ? "There is no account with this email yet. Create one first." : error.message });
  back("/signin/code", { email, sent: "1" });
}

export async function verifyCode(formData: FormData) {
  const email = emailFrom(formData);
  const token = String(formData.get("token") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) back("/signin/code", { email, sent: "1", error: "That code didn't work. Check it, or ask for a new one." });
  await goHome(supabase, null);
}

export async function sendPasswordReset(formData: FormData) {
  const email = emailFrom(formData);
  if (!email) back("/signin/forgot", { error: "Enter your email." });

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/signin/new-password")}`,
  });
  // Say "sent" even for unknown emails, so the page doesn't tell strangers who has an account.
  if (error && error.status !== 400) back("/signin/forgot", { email, error: error.message });
  back("/signin/forgot", { email, sent: "1" });
}

export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) back("/signin/new-password", { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
  if (password !== confirm) back("/signin/new-password", { error: "The passwords don't match." });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    back("/signin/new-password", {
      error: error.code === "same_password" ? "Choose a password you haven't used here before." : error.code === "weak_password" ? "Choose a longer password that is harder to guess." : error.message,
    });
  }
  await goHome(supabase, null);
}
