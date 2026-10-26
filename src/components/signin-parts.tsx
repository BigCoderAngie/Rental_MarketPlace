import Link from "next/link";
import type { ReactNode } from "react";
import { focusRingClass } from "@/components/button";
import { StoreButtons } from "@/components/store-buttons";
import { ROUTES } from "@/lib/site-links";

// Shared pieces of the sign-in pages (docs/build-kit/reference/desktop/SiteLogin.html).

/** The centred page heading: "Welcome back" and its line. */
export function SignInHeading({ title, line }: { title: string; line: ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="text-[26px] font-extrabold tracking-[-0.02em] md:text-[32px]">{title}</h2>
      <p className="mt-1.5 text-muted-foreground md:mt-2 md:text-[15.5px]">{line}</p>
    </div>
  );
}

/** "or" / "or get the app", the store buttons, Back to home and Create an account. */
export function SignInFooter() {
  return (
    <>
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span className="md:hidden">or get the app</span>
        <span className="hidden md:inline">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="md:hidden">
        <StoreButtons stacked />
      </div>
      <div className="hidden md:block">
        <StoreButtons light />
      </div>
      <Link href={ROUTES.home} className={`self-center rounded py-1.5 text-[14.5px] font-semibold text-muted-foreground hover:text-foreground ${focusRingClass}`}>
        ← Back to home
      </Link>
      <p className="text-center text-[15px]">
        New to RentLoop?{" "}
        <Link href={ROUTES.join} className="font-bold text-primary underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`inline-block rounded py-1 text-sm font-semibold text-primary underline hover:text-primary-strong ${focusRingClass}`}>
      {children}
    </Link>
  );
}
