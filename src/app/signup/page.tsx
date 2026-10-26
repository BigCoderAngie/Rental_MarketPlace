import type { Metadata } from "next";
import { AccountStep } from "@/components/account-step";
import { SignupFrame } from "@/components/signup-frame";
import { ACCOUNT_ICON, FaqLink, SignInLink } from "@/components/signup-pages";
import { signupHref, signupNext } from "@/lib/signup-start";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Create your account | RentLoop" };

// Step 1 of the one sign-up (docs/build-kit/reference/desktop/SiteSignUp.html).
// The same for everyone: owner questions come later, on "Before you list".
export default async function SignupAccountPage({ searchParams }: PageProps<"/signup">) {
  const next = signupNext(await searchParams);
  return (
    <SignupFrame
      title="Create your account"
      subtitle={
        <>
          Free to rent. Free to list. <strong className="text-primary">We only earn when you earn.</strong>
        </>
      }
      headerRight={<FaqLink />}
      phoneTitle="Sign up"
      backHref={ROUTES.home}
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
        nextHref={signupHref("/signup/about", next)}
        privacyNote="Others only see your name and number once a booking is accepted."
        backHref={ROUTES.signIn}
        backLabel="Back to sign in"
      />
    </SignupFrame>
  );
}
