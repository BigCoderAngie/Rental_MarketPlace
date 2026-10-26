"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { signUp, type SignupState } from "@/app/signup/actions";
import { CheckboxRow, FormMessage, Required, SelectField } from "@/components/auth-fields";
import { Button, ButtonLink } from "@/components/button";
import { StickyActions } from "@/components/signup-frame";
import { useSignupDraft } from "@/components/signup-draft";
import { SIGNUP_TOWNS, hasErrors, validateAboutYou } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";

/**
 * Step 2 of the one sign-up: town, the Terms box (required, rule 17) and
 * WhatsApp updates. The owner questions and booking fee box (rule 16) come
 * later, on "Before you list". The form stops with a message before anything
 * is sent if something required is missing, and the server action checks again.
 */
export function AboutStep({ next, step1Href }: { next: string; step1Href: string }) {
  const router = useRouter();
  const { account } = useSignupDraft();
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signUp, {});
  const [local, setLocal] = useState<Record<string, string>>({});
  const errors = { ...state.errors, ...local };

  // Step 2 opened without step 1 (a reload or a shared link): start again.
  useEffect(() => {
    if (!account) router.replace(step1Href);
  }, [account, router, step1Href]);
  if (!account) return null;

  // Calls the action itself rather than <form action>, because React clears a
  // form after a form action, which would wipe the choices when the server
  // answers with a problem (for example "There is already an account").
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validateAboutYou({ town: String(form.get("town")), terms: form.get("terms") === "on" });
    setLocal(found);
    if (hasErrors(found)) {
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    startTransition(() => formAction(form));
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-[18px] md:gap-[22px]">
      {Object.entries(account).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="next" value={next} />
      <FormMessage message={state.message} />

      <div className="md:max-w-[calc(50%-11px)]">
        <SelectField label="Town" name="town" required options={SIGNUP_TOWNS} defaultValue="Windhoek" error={errors.town} />
        <p className="mt-2 text-[13px] text-muted-foreground">One account rents and lists. When you list your first item we ask a few owner questions.</p>
      </div>

      <div className="flex flex-col gap-3.5 rounded-[16px] border border-border bg-card p-4 md:border-0 md:bg-background md:px-5 md:py-[18px]">
        <CheckboxRow name="terms" required error={errors.terms}>
          I agree to the{" "}
          <Link href={ROUTES.terms} target="_blank" className="font-semibold text-primary underline">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-semibold text-primary underline">
            Privacy Policy
          </Link>
          <Required />
          <br />
          <span className="text-[13px] text-muted-foreground">Everyone agrees to these before they can rent or list.</span>
        </CheckboxRow>
        <CheckboxRow name="whatsappUpdates">
          Send me WhatsApp updates about my bookings<span className="hidden text-muted-foreground md:inline"> (optional)</span>
        </CheckboxRow>
      </div>

      <StickyActions>
        <ButtonLink href={step1Href} variant="white" size="lg" aria-label="Previous" className="w-14 flex-none px-0 md:w-auto md:px-[22px]">
          ←<span className="hidden md:inline"> Previous</span>
        </ButtonLink>
        <Button type="submit" size="lg" disabled={pending} className="flex-1 md:flex-none md:px-8">
          {pending ? "Creating your account…" : "Create my account"}
        </Button>
      </StickyActions>
    </form>
  );
}
