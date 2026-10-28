import type { Metadata } from "next";
import { FormMessage, LineIcon, TextField } from "@/components/auth-fields";
import { BotCheck } from "@/components/bot-check";
import { Button, buttonClasses } from "@/components/button";
import { SampleTag } from "@/components/sample-tag";
import { SignInFooter, SignInHeading, TextLink } from "@/components/signin-parts";
import { signInWithPassword } from "./actions";

export const metadata: Metadata = { title: "Sign in | RentLoop" };

/**
 * Sign in (docs/build-kit/reference/desktop/SiteLogin.html). The kit's
 * "Mobile code" tab is shown but off until an SMS provider is chosen (build kit
 * decision 3), so Email (email and password) is the one in use.
 */
export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : undefined;
  const next = typeof params.next === "string" ? params.next : "";

  return (
    <>
      <SignInHeading title="Welcome back" line="Sign in to your RentLoop account" />

      <div role="tablist" aria-label="Sign in with" className="flex gap-1.5 rounded-btn bg-background p-1 md:justify-center md:gap-3 md:bg-transparent md:p-0">
        <button
          type="button"
          role="tab"
          aria-selected="false"
          disabled
          title="Coming soon"
          className="flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-1 rounded-btn-sm whitespace-nowrap md:gap-2 text-sm font-semibold text-muted-foreground md:h-[46px] md:flex-none md:border md:border-input md:bg-card md:px-5"
        >
          <span className="hidden md:inline">
            <LineIcon size={18}>
              <rect x="7" y="2" width="10" height="20" rx="2.5" />
              <path d="M11 18h2" />
            </LineIcon>
          </span>
          Mobile code
          {/* The tag doesn't fit beside the label on phones. */}
          <span className="md:hidden">(soon)</span>
          <span className="hidden md:inline-flex">
            <SampleTag>Soon</SampleTag>
          </span>
        </button>
        <button type="button" role="tab" aria-selected="true" className={buttonClasses({ size: "sm", className: "flex-1 md:h-[46px] md:flex-none md:px-5" })}>
          <span className="hidden md:inline">
            <LineIcon size={18}>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </LineIcon>
          </span>
          Email
        </button>
      </div>

      <form action={signInWithPassword} className="flex flex-col gap-[18px]">
        <FormMessage message={error} />
        <input type="hidden" name="next" value={next} />
        <TextField label="Email address" name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={email} />
        <TextField label="Password" name="password" type="password" required autoComplete="current-password" placeholder="Your password" />
        <div className="-mt-1.5 flex flex-wrap justify-between gap-2">
          <TextLink href="/signin/forgot">Forgot password?</TextLink>
          <TextLink href="/signin/code">Email me a sign-in code instead</TextLink>
        </div>
        <BotCheck />
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>

      <SignInFooter />
    </>
  );
}
