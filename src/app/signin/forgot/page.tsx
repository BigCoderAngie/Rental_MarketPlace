import type { Metadata } from "next";
import { FormMessage, TextField } from "@/components/auth-fields";
import { Button } from "@/components/button";
import { SignInHeading, TextLink } from "@/components/signin-parts";
import { sendPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Forgot password | RentLoop" };

// Emails a link to choose a new password. Also how accounts made before
// passwords (email code only) set their first one.
export default async function ForgotPasswordPage({ searchParams }: PageProps<"/signin/forgot">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <>
      <SignInHeading
        title={sent ? "Check your email" : "Forgot your password?"}
        line={
          sent ? (
            <>
              If there is an account for <strong>{email}</strong>, we sent it a link to choose a new password.
            </>
          ) : (
            "We email you a link to choose a new one."
          )
        }
      />
      <FormMessage message={error} />
      {!sent && (
        <form action={sendPasswordReset} className="flex flex-col gap-[18px]">
          <TextField label="Email address" name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={email} />
          <Button type="submit" size="lg" className="w-full">
            Email me a link
          </Button>
        </form>
      )}
      <span className="self-center">
        <TextLink href="/signin">← Back to sign in</TextLink>
      </span>
    </>
  );
}
