import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormMessage, TextField } from "@/components/auth-fields";
import { Button } from "@/components/button";
import { SignInHeading } from "@/components/signin-parts";
import { MIN_PASSWORD_LENGTH } from "@/lib/signup";
import { createClient } from "@/lib/supabase/server";
import { setNewPassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password | RentLoop" };

// The link from "Forgot password?" signs the person in and lands here.
export default async function NewPasswordPage({ searchParams }: PageProps<"/signin/new-password">) {
  const { data } = await (await createClient()).auth.getClaims();
  if (!data?.claims) redirect("/signin/forgot?error=That+link+has+expired.+Ask+for+a+new+one.");
  const error = (await searchParams).error;

  return (
    <>
      <SignInHeading title="Choose a new password" line={`At least ${MIN_PASSWORD_LENGTH} characters.`} />
      <FormMessage message={typeof error === "string" ? error : undefined} />
      <form action={setNewPassword} className="flex flex-col gap-[18px]">
        <TextField label="New password" name="password" type="password" required autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} />
        <TextField label="Confirm password" name="confirm" type="password" required autoComplete="new-password" placeholder="Type it again" />
        <Button type="submit" size="lg" className="w-full">
          Save and sign in
        </Button>
      </form>
    </>
  );
}
