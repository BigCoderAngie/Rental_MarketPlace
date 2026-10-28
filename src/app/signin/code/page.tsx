import type { Metadata } from "next";
import { FormMessage, TextField } from "@/components/auth-fields";
import { BotCheck } from "@/components/bot-check";
import { Button } from "@/components/button";
import { SignInFooter, SignInHeading, TextLink } from "@/components/signin-parts";
import { sendCode, verifyCode } from "../actions";

export const metadata: Metadata = { title: "Sign in with a code | RentLoop" };

// The email code sign-in from the old /login page, kept for accounts made
// before passwords. Supabase's built-in email sends only a few emails an hour.
export default async function CodeSignInPage({ searchParams }: PageProps<"/signin/code">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <>
      <SignInHeading
        title="Sign in with a code"
        line={
          sent ? (
            <>
              We sent a 6-digit code to <strong>{email}</strong>.
            </>
          ) : (
            "We email you a 6-digit code. No password needed."
          )
        }
      />
      <FormMessage message={error} />
      {sent ? (
        <form action={verifyCode} className="flex flex-col gap-[18px]">
          <input type="hidden" name="email" value={email} />
          <TextField label="Code" name="token" required inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
          <p className="-mt-2 text-[13px] text-muted-foreground">Enter the code, or open the link in the email.</p>
          <Button type="submit" size="lg" className="w-full">
            Sign in
          </Button>
          <span className="self-center">
            <TextLink href="/signin/code">Use a different email</TextLink>
          </span>
        </form>
      ) : (
        <form action={sendCode} className="flex flex-col gap-[18px]">
          <TextField label="Email address" name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={email} />
          <BotCheck />
          <Button type="submit" size="lg" className="w-full">
            Email me a code
          </Button>
          <span className="self-center">
            <TextLink href="/signin">Sign in with a password instead</TextLink>
          </span>
        </form>
      )}
      <SignInFooter />
    </>
  );
}
