"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasErrors,
  normalizeNamibianMobile,
  safeNextPath,
  validateAccount,
  validateOwnerDetails,
  validateRenterDetails,
  type AccountInput,
} from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { errors?: Record<string, string>; message?: string };

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

function accountFrom(formData: FormData): AccountInput {
  return {
    fullName: text(formData, "fullName").trim(),
    email: text(formData, "email").trim().toLowerCase(),
    phone: text(formData, "phone"),
    password: text(formData, "password"),
    confirm: text(formData, "confirm"),
  };
}

// Renters see "You're in"; owners go straight to listing their first item (build kit Part 4).
const AFTER_SIGNUP = { renter: ROUTES.welcome, owner: ROUTES.listItem };

/**
 * Creates the account with Supabase email and password. The details go along
 * as user metadata; the sign-up trigger copies them into the profile
 * (supabase/migrations/20261023000000_signup_details.sql). If the project asks
 * people to confirm their email first, there is no session yet, so they see
 * "Check your email" and the link brings them to the next page.
 */
async function createAccount(account: AccountInput, details: Record<string, string | boolean>, path: "renter" | "owner", wanted: FormDataEntryValue | null): Promise<SignupState> {
  const origin = (await headers()).get("origin") ?? "";
  // Back to what a visitor was doing (for example an item they wanted to request), else the path's next page.
  const next = safeNextPath(typeof wanted === "string" ? wanted : null) ?? AFTER_SIGNUP[path];
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        full_name: account.fullName,
        phone: normalizeNamibianMobile(account.phone),
        signup_path: path,
        terms_accepted: true,
        ...details,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") return { message: "There is already an account with this email. Sign in instead." };
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

export async function signUpRenter(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const account = accountFrom(formData);
  const details = { town: text(formData, "town"), firstGoal: text(formData, "firstGoal"), terms: formData.get("terms") === "on" };
  const errors = { ...validateAccount(account), ...validateRenterDetails(details) };
  if (hasErrors(errors)) return { errors, message: accountProblem(errors) };

  return createAccount(
    account,
    {
      home_town: details.town,
      first_goal: details.firstGoal,
      runs_hire_business: formData.get("runsHireBusiness") === "on",
      whatsapp_updates: formData.get("whatsappUpdates") === "on",
    },
    "renter",
    formData.get("next"),
  );
}

export async function signUpOwner(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const account = accountFrom(formData);
  const details = {
    ownerKind: text(formData, "ownerKind"),
    businessName: text(formData, "businessName").trim(),
    town: text(formData, "town"),
    feeAcknowledged: formData.get("feeAcknowledged") === "on",
    terms: formData.get("terms") === "on",
  };
  const errors = { ...validateAccount(account), ...validateOwnerDetails(details) };
  if (hasErrors(errors)) return { errors, message: accountProblem(errors) };

  return createAccount(
    account,
    {
      owner_kind: details.ownerKind,
      business_name: details.ownerKind === "business" ? details.businessName : "",
      home_town: details.town,
      fee_acknowledged: true,
    },
    "owner",
    formData.get("next"),
  );
}

/** Step 1's fields aren't on step 2, so a problem there gets a note pointing back. */
function accountProblem(errors: Record<string, string>): string | undefined {
  const onStep1 = ["fullName", "email", "phone", "password", "confirm"].some((k) => k in errors);
  return onStep1 ? "Something on the Account step needs fixing. Go back to step 1 and check it." : undefined;
}
