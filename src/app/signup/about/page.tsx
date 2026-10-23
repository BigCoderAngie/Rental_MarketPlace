import type { Metadata } from "next";
import { AboutStep } from "@/components/about-step";
import { LineIcon } from "@/components/auth-fields";
import { SignupFrame } from "@/components/signup-frame";
import { AlmostDone } from "@/components/signup-draft";
import { PhoneAppLine, SignInLink } from "@/components/signup-pages";
import { signupHref, signupStart } from "@/lib/signup-start";

export const metadata: Metadata = { title: "About you | Create your account | RentLoop" };

// Step 2 of the one sign-up (SiteSignUp2.html, with SiteOwnerSignUp2.html's
// owner questions shown when someone picks "Earn from my things").
export default async function SignupAboutPage({ searchParams }: PageProps<"/signup/about">) {
  const { start, next } = signupStart(await searchParams);
  const earn = start === "earn";
  const step1 = signupHref("/signup", start, next);
  return (
    <SignupFrame
      title={earn ? "Start earning with RentLoop" : "Create your account"}
      pill={earn ? "For owners and hire businesses" : undefined}
      subtitle={<AlmostDone />}
      headerRight={<SignInLink />}
      phoneTitle={earn ? "Sign up to list" : "Sign up to rent"}
      backHref={step1}
      step={2}
      steps={["Account", "About you"]}
      sectionTitle="About you"
      sectionIcon={
        <LineIcon>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </LineIcon>
      }
      below={<PhoneAppLine>{earn ? "List faster from your phone:" : "Prefer your phone?"}</PhoneAppLine>}
    >
      <AboutStep start={start} next={next ?? ""} step1Href={step1} />
    </SignupFrame>
  );
}
