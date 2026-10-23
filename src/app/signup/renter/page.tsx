import type { Metadata } from "next";
import { AccountStep } from "@/components/account-step";
import { SignupFrame } from "@/components/signup-frame";
import { ACCOUNT_ICON, FaqLink, SignInLink } from "@/components/signup-pages";
import { safeNextPath } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Sign up to rent | RentLoop" };

// docs/build-kit/reference/desktop/SiteSignUp.html and mobile/SiteSignUp.html
export default async function RenterAccountPage({ searchParams }: PageProps<"/signup/renter">) {
  const next = safeNextPath(String((await searchParams).next ?? ""));
  return (
    <SignupFrame
      title="Create your account"
      subtitle={
        <>
          Free for renters. Free to list. <strong className="text-primary">We only earn when you earn.</strong>
        </>
      }
      headerRight={<FaqLink />}
      phoneTitle="Sign up to rent"
      backHref={ROUTES.join}
      step={1}
      steps={["Account", "About you"]}
      sectionTitle="Account information"
      sectionIcon={ACCOUNT_ICON}
      below={
        <p className="text-center text-[15px]">
          <SignInLink label="Sign in here" />
        </p>
      }
    >
      <AccountStep
        nextHref={next ? `/signup/renter/about?${new URLSearchParams({ next })}` : "/signup/renter/about"}
        privacyNote="Owners only see your name and number once they accept your booking."
        backHref={ROUTES.signIn}
        backLabel="← Back to sign in"
      />
    </SignupFrame>
  );
}
