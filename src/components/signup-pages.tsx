import Link from "next/link";
import type { ReactNode } from "react";
import { LineIcon } from "@/components/auth-fields";
import { StoreButtons } from "@/components/store-buttons";
import { ROUTES } from "@/lib/site-links";

// Pieces shared by the four sign-up pages (docs/build-kit/reference/desktop/Site*SignUp*.html).

export const ACCOUNT_ICON = (
  <LineIcon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </LineIcon>
);

export function FaqLink() {
  return (
    <>
      Need help?{" "}
      <Link href={ROUTES.help} className="font-semibold text-primary underline">
        Read the FAQ
      </Link>
    </>
  );
}

export function SignInLink({ label = "Sign in" }: { label?: string }) {
  return (
    <>
      Already have an account?{" "}
      <Link href={ROUTES.signIn} className="font-semibold text-primary underline">
        {label}
      </Link>
    </>
  );
}

/** "Prefer your phone?" and the store buttons, under step 2 on desktop. */
export function PhoneAppLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="text-[14.5px] text-muted-foreground">{children}</span>
      <StoreButtons />
    </div>
  );
}
