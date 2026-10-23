import type { Metadata } from "next";
import { AccountStep } from "@/components/account-step";
import { SignupFrame } from "@/components/signup-frame";
import { ACCOUNT_ICON, FaqLink, SignInLink } from "@/components/signup-pages";
import { signupHref, signupStart } from "@/lib/signup-start";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Create your account | RentLoop" };

// Step 1 of the one sign-up (docs/build-kit/reference/desktop/SiteSignUp.html and
// SiteOwnerSignUp.html). Starting from "I want to earn" only changes the title.
export default async function SignupAccountPage({ searchParams }: PageProps<"/signup">) {
  const { start, next } = signupStart(await searchParams);
  const earn = start === "earn";
  return (
    <SignupFrame
      title={earn ? "Start earning with RentLoop" : "Create your account"}
      pill={earn ? "For owners and hire businesses" : undefined}
      subtitle={
        <>
          {earn ? "N$0 to list." : "Free for renters. Free to list."} <strong className="text-primary">We only earn when you earn.</strong>
        </>
      }
      headerRight={earn ? <SignInLink /> : <FaqLink />}
      phoneTitle={earn ? "Sign up to list" : "Sign up to rent"}
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
        nextHref={signupHref("/signup/about", start, next)}
        privacyNote="Others only see your name and number once a booking is accepted."
        backHref={earn ? ROUTES.join : ROUTES.signIn}
        backLabel={earn ? "← Back" : "← Back to sign in"}
      />
    </SignupFrame>
  );
}
