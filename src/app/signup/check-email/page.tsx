import type { Metadata } from "next";
import Link from "next/link";
import { LineIcon } from "@/components/auth-fields";
import { focusRingClass } from "@/components/button";
import { Logo } from "@/components/logo";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Check your email | RentLoop" };

// After sign-up, when Supabase asks people to confirm their email before the
// account can be used. The link in the email signs them in and opens "You're in".
export default async function CheckEmailPage({ searchParams }: PageProps<"/signup/check-email">) {
  const email = (await searchParams).email;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-6">
      <Link href={ROUTES.home} aria-label="RentLoop home" className={`rounded ${focusRingClass}`}>
        <Logo className="text-[23px] [--mark:38px]" />
      </Link>
      <main className="mt-12 flex w-full max-w-md flex-col items-center gap-4 rounded-card border border-border bg-card p-8 text-center">
        <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-soft text-primary">
          <LineIcon size={30}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </LineIcon>
        </span>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">Check your email</h1>
        <p className="text-[15px] leading-normal text-foreground-soft">
          We sent a link to {typeof email === "string" && email ? <strong>{email}</strong> : "your email"}. Open it to confirm your account and you&apos;re in.
        </p>
        <p className="text-[13px] text-muted-foreground">Nothing there? Check your spam folder, or wait a few minutes.</p>
        <Link href={ROUTES.signIn} className={`rounded text-sm font-semibold text-primary underline ${focusRingClass}`}>
          Go to sign in
        </Link>
      </main>
    </div>
  );
}
