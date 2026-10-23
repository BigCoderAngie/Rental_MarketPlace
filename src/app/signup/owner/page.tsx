import type { Metadata } from "next";
import Link from "next/link";
import { AccountStep } from "@/components/account-step";
import { SignupFrame } from "@/components/signup-frame";
import { ACCOUNT_ICON, SignInLink } from "@/components/signup-pages";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Sign up to list | RentLoop" };

// docs/build-kit/reference/desktop/SiteOwnerSignUp.html and mobile/SiteOwnerSignUp.html
export default function OwnerAccountPage() {
  return (
    <SignupFrame
      title="Start earning with RentLoop"
      pill="For owners and hire businesses"
      subtitle={
        <>
          N$0 to list. <strong className="text-primary">We only earn when you earn.</strong>
        </>
      }
      headerRight={<SignInLink />}
      phoneTitle="Sign up to list"
      backHref={ROUTES.join}
      step={1}
      steps={["Account", "Owner details"]}
      sectionTitle="Account information"
      sectionIcon={ACCOUNT_ICON}
      below={
        <p className="text-center text-[15px]">
          Only want to rent?{" "}
          <Link href={ROUTES.renterSignUp} className="font-bold text-primary underline">
            Sign up to rent
          </Link>{" "}
          · <SignInLink />
        </p>
      }
    >
      <AccountStep
        nextHref="/signup/owner/details"
        privacyNote="Renters only see your name, number and address once you accept their booking."
        backHref={ROUTES.join}
        backLabel="← Back"
      />
    </SignupFrame>
  );
}
