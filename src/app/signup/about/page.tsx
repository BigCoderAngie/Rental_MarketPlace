import type { Metadata } from "next";
import { AboutStep } from "@/components/about-step";
import { LineIcon } from "@/components/auth-fields";
import { SignupFrame } from "@/components/signup-frame";
import { AlmostDone } from "@/components/signup-draft";
import { PhoneAppLine, SignInLink } from "@/components/signup-pages";
import { signupHref, signupNext } from "@/lib/signup-start";

export const metadata: Metadata = { title: "About you | Create your account | RentLoop" };

// Step 2 of the one sign-up (SiteSignUp2.html): town and the Terms box.
export default async function SignupAboutPage({ searchParams }: PageProps<"/signup/about">) {
  const next = signupNext(await searchParams);
  const step1 = signupHref("/signup", next);
  return (
    <SignupFrame
      title="Create your account"
      subtitle={<AlmostDone />}
      headerRight={<SignInLink />}
      phoneTitle="Sign up"
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
      below={<PhoneAppLine>Prefer your phone?</PhoneAppLine>}
    >
      <AboutStep next={next ?? ""} step1Href={step1} />
    </SignupFrame>
  );
}
