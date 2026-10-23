import type { Metadata } from "next";
import { LineIcon } from "@/components/auth-fields";
import { RenterDetailsStep } from "@/components/details-steps";
import { SignupFrame } from "@/components/signup-frame";
import { AlmostDone } from "@/components/signup-draft";
import { PhoneAppLine, SignInLink } from "@/components/signup-pages";
import { safeNextPath } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "About you | Sign up to rent | RentLoop" };

// docs/build-kit/reference/desktop/SiteSignUp2.html and mobile/SiteSignUp2.html
export default async function RenterAboutPage({ searchParams }: PageProps<"/signup/renter/about">) {
  const next = safeNextPath(String((await searchParams).next ?? "")) ?? "";
  return (
    <SignupFrame
      title="Create your account"
      subtitle={<AlmostDone />}
      headerRight={<SignInLink />}
      phoneTitle="Sign up to rent"
      backHref={ROUTES.renterSignUp}
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
      <RenterDetailsStep next={next} />
    </SignupFrame>
  );
}
