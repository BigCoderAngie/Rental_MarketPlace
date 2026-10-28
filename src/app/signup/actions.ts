"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BOT_CHECK_FAILED, captchaOption, isBotCheckError } from "@/lib/bot-check";
import { hasErrors, normalizeNamibianMobile, safeNextPath, validateAboutYou, validateAccount, type AboutYou, type AccountInput } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { errors?: Record<string, string>; message?: string };

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

/**
 * The one sign-up (one account rents and lists). Creates the account with
 * Supabase email and password; the details go along as user metadata and the
 * sign-up trigger copies them into the profile
 * (supabase/migrations/20261023000000_signup_details.sql). The owner questions
 * and booking fee tick are saved later, on "Before you list". If the project asks
 * people to confirm their email first, there is no session yet, so they see
 * "Check your email" and the link brings them to the next page.
 */
export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const account: AccountInput = {
    fullName: text(formData, "fullName").trim(),
    email: text(formData, "email").trim().toLowerCase(),
    phone: text(formData, "phone"),
    password: text(formData, "password"),
    confirm: text(formData, "confirm"),
  };
  const about: AboutYou = { town: text(formData, "town"), terms: formData.get("terms") === "on" };
  const errors = { ...validateAccount(account), ...validateAboutYou(about) };
  if (hasErrors(errors)) {
    const onStep1 = ["fullName", "email", "phone", "password", "confirm"].some((k) => k in errors);
    return { errors, message: onStep1 ? "Something on the Account step needs fixing. Go back to step 1 and check it." : undefined };
  }

  const wanted = formData.get("next");
  // Back to what a visitor was doing (an item they wanted to request, or List an item), else "You're in".
  const next = safeNextPath(typeof wanted === "string" ? wanted : null) ?? ROUTES.welcome;
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        full_name: account.fullName,
        phone: normalizeNamibianMobile(account.phone),
        home_town: about.town,
        whatsapp_updates: formData.get("whatsappUpdates") === "on",
        terms_accepted: true,
      },
      ...captchaOption(formData),
    },
  });

  if (error) {
    if (error.code === "user_already_exists") return { message: "There is already an account with this email. Sign in instead." };
    if (isBotCheckError(error)) return { message: BOT_CHECK_FAILED };
    if (error.code === "weak_password") return { errors: { password: "Choose a longer password that is harder to guess." } };
    return { message: error.message };
  }
  // With email confirmation on, Supabase answers an existing email with a user that has no identities.
  if (data.user && data.user.identities?.length === 0) {
    return { message: "There is already an account with this email. Sign in instead." };
  }
  if (!data.session) redirect(`/signup/check-email?${new URLSearchParams({ email: account.email })}`);
  redirect(next);
}
