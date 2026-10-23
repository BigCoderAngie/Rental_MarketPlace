import type { Metadata } from "next";
import { LineIcon } from "@/components/auth-fields";
import { OwnerDetailsStep } from "@/components/details-steps";
import { SignupFrame } from "@/components/signup-frame";
import { AlmostDone } from "@/components/signup-draft";
import { PhoneAppLine, SignInLink } from "@/components/signup-pages";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Owner details | Sign up to list | RentLoop" };

// docs/build-kit/reference/desktop/SiteOwnerSignUp2.html and mobile/SiteOwnerSignUp2.html
export default function OwnerDetailsPage() {
  return (
    <SignupFrame
      title="Start earning with RentLoop"
      pill="For owners and hire businesses"
      subtitle={<AlmostDone />}
      headerRight={<SignInLink />}
      phoneTitle="Sign up to list"
      backHref={ROUTES.ownerSignUp}
      step={2}
      steps={["Account", "Owner details"]}
      sectionTitle="Owner details"
      sectionIcon={
        <LineIcon>
          <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
        </LineIcon>
      }
      below={<PhoneAppLine>List faster from your phone:</PhoneAppLine>}
    >
      <OwnerDetailsStep />
    </SignupFrame>
  );
}
