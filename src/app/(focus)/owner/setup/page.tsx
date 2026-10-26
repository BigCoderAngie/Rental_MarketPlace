import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LineIcon } from "@/components/auth-fields";
import { OwnerSetupForm } from "@/components/owner-setup-form";
import { SignupFrame } from "@/components/signup-frame";
import { FaqLink } from "@/components/signup-pages";
import { needsOwnerSetup } from "@/lib/owner-setup";
import { ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Before you list | RentLoop" };

// The extra page someone sees the first time they list (SiteOwnerSignUp2.html's
// owner questions): sign-up stays the same for everyone, and these are asked once, here.
export default async function OwnerSetupPage() {
  if (!(await needsOwnerSetup(await createClient()))) redirect(ROUTES.listItem);
  return (
    <SignupFrame
      title="Before you list"
      pill="For owners and hire businesses"
      subtitle={
        <>
          You answer these once. N$0 to list. <strong className="text-primary">We only earn when you earn.</strong>
        </>
      }
      headerRight={<FaqLink />}
      phoneTitle="Before you list"
      backHref={ROUTES.home}
      step={1}
      steps={["Owner details", "Your first item"]}
      sectionTitle="Owner details"
      sectionIcon={
        <LineIcon>
          <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
        </LineIcon>
      }
    >
      <OwnerSetupForm />
    </SignupFrame>
  );
}
