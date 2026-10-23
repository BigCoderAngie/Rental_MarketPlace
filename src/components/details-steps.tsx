"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { signUpOwner, signUpRenter, type SignupState } from "@/app/signup/actions";
import { CheckboxRow, ChoiceCard, FormMessage, LineIcon, Required, SelectField, TextField } from "@/components/auth-fields";
import { Button, ButtonLink } from "@/components/button";
import { StickyActions } from "@/components/signup-frame";
import { useSignupDraft } from "@/components/signup-draft";
import { SIGNUP_TOWNS, hasErrors, validateOwnerDetails, validateRenterDetails } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";

// Step 2 of both sign-up paths. The terms box (and for owners the booking fee
// box) must be ticked: the form stops with a message before anything is sent,
// and the server action checks again (build kit rule 17).

/** Sends people back to step 1 when step 2 was opened without it (a reload or a shared link). */
function useAccountOrRestart(step1Href: string) {
  const router = useRouter();
  const { account } = useSignupDraft();
  useEffect(() => {
    if (!account) router.replace(step1Href);
  }, [account, router, step1Href]);
  return account;
}

function AccountFields() {
  const { account } = useSignupDraft();
  if (!account) return null;
  return (
    <>
      {Object.entries(account).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

function TermsText() {
  return (
    <>
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
    </>
  );
}

/**
 * Checks the form in the browser first: a missing required box or field shows
 * its message and nothing is sent. Otherwise it calls the server action
 * itself instead of using <form action>, because React clears a form after a
 * form action runs, which would wipe the person's choices when the server
 * answers with a problem (for example "There is already an account").
 */
function submit(
  event: FormEvent<HTMLFormElement>,
  check: (form: FormData) => Record<string, string>,
  show: (e: Record<string, string>) => void,
  send: (form: FormData) => void,
) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const errors = check(form);
  show(errors);
  if (hasErrors(errors)) {
    event.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
    return;
  }
  startTransition(() => send(form));
}

function Actions({ back, children }: { back: string; children: ReactNode }) {
  return (
    <StickyActions>
      <ButtonLink href={back} variant="white" size="lg" aria-label="Previous" className="w-14 flex-none px-0 md:w-auto md:px-[22px]">
        ←<span className="hidden md:inline"> Previous</span>
      </ButtonLink>
      {children}
    </StickyActions>
  );
}

export function RenterDetailsStep() {
  const account = useAccountOrRestart(ROUTES.renterSignUp);
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signUpRenter, {});
  const [local, setLocal] = useState<Record<string, string>>({});
  const errors = { ...state.errors, ...local };
  if (!account) return null;

  return (
    <form
      noValidate
      onSubmit={(e) =>
        submit(
          e,
          (f) => validateRenterDetails({ town: String(f.get("town")), firstGoal: String(f.get("firstGoal") ?? ""), terms: f.get("terms") === "on" }),
          setLocal,
          formAction,
        )
      }
      className="flex flex-col gap-[18px] md:gap-[22px]"
    >
      <AccountFields />
      <FormMessage message={state.message} />
      <div className="md:max-w-[calc(50%-11px)]">
        <SelectField label="Town" name="town" required options={SIGNUP_TOWNS} defaultValue="Windhoek" error={errors.town} />
      </div>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-[13px] font-semibold">What do you want to do first?</legend>
        <div className="grid gap-2.5 md:grid-cols-2 md:gap-3.5">
          <ChoiceCard name="firstGoal" value="rent" defaultChecked tone="green" title="Rent something" line="Find gear near me" icon={<LineIcon><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></LineIcon>} />
          <ChoiceCard name="firstGoal" value="earn" tone="yellow" title="Earn from my things" line="List an item now" icon={<LineIcon><path d="M12 5v14M5 12h14" /></LineIcon>} />
        </div>
      </fieldset>
      <div className="flex flex-col gap-3.5 rounded-[16px] border border-border bg-card p-4 md:border-0 md:bg-background md:px-5 md:py-[18px]">
        <CheckboxRow name="runsHireBusiness">
          I run a hire business<span className="hidden text-muted-foreground md:inline"> (you can add your business name and logo later)</span>
        </CheckboxRow>
        <CheckboxRow name="terms" required error={errors.terms}>
          <TermsText />
        </CheckboxRow>
        <CheckboxRow name="whatsappUpdates">
          Send me WhatsApp updates about my bookings<span className="hidden text-muted-foreground md:inline"> (optional)</span>
        </CheckboxRow>
      </div>
      <Actions back={ROUTES.renterSignUp}>
        <Button type="submit" size="lg" disabled={pending} className="flex-1 md:flex-none md:px-8">
          <span className="hidden md:inline">
            <LineIcon size={20}>
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12l3 3 5-6" />
            </LineIcon>
          </span>
          {pending ? "Creating your account…" : "Create my account"}
        </Button>
      </Actions>
    </form>
  );
}

export function OwnerDetailsStep() {
  const account = useAccountOrRestart(ROUTES.ownerSignUp);
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signUpOwner, {});
  const [local, setLocal] = useState<Record<string, string>>({});
  const errors = { ...state.errors, ...local };
  if (!account) return null;

  return (
    <form
      noValidate
      onSubmit={(e) =>
        submit(
          e,
          (f) =>
            validateOwnerDetails({
              ownerKind: String(f.get("ownerKind") ?? ""),
              businessName: String(f.get("businessName") ?? ""),
              town: String(f.get("town")),
              feeAcknowledged: f.get("feeAcknowledged") === "on",
              terms: f.get("terms") === "on",
            }),
          setLocal,
          formAction,
        )
      }
      className="flex flex-col gap-[18px] md:gap-[22px]"
    >
      <AccountFields />
      <FormMessage message={state.message} />
      <fieldset>
        <legend className="mb-2.5 text-[13px] font-semibold">
          You are listing as
          <Required />
        </legend>
        <div className="grid gap-2.5 md:grid-cols-2 md:gap-3.5">
          <ChoiceCard name="ownerKind" value="individual" defaultChecked tone="green" title="An individual" line="I own things I don't use every day" icon={<LineIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></LineIcon>} />
          <ChoiceCard name="ownerKind" value="business" tone="yellow" title="A hire business" line="Staff, quotes and checkout records" icon={<LineIcon><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></LineIcon>} />
        </div>
      </fieldset>
      <div className="grid gap-[18px] md:grid-cols-2 md:gap-x-[22px]">
        <TextField label="Business name" name="businessName" autoComplete="organization" placeholder="Only if you are a hire business" error={errors.businessName} />
        <SelectField label="Town" name="town" required options={SIGNUP_TOWNS} defaultValue="Windhoek" error={errors.town} />
      </div>
      <div className="flex items-center gap-3.5 rounded-[16px] border border-primary-border bg-primary-soft px-[18px] py-4">
        <span aria-hidden className="flex h-11 w-11 flex-none items-center justify-center rounded-btn-sm bg-primary text-primary-foreground">
          <LineIcon>
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            <path d="M9 12l2 2 4-4" />
          </LineIcon>
        </span>
        <span className="flex flex-col gap-0.5">
          <strong>Verify your ID after sign up</strong>
          <span className="text-sm text-foreground-soft">Take a photo of your ID in the app. Verified owners show up first in search.</span>
        </span>
      </div>
      <div className="flex flex-col gap-3.5 rounded-[16px] border border-border bg-card p-4 md:border-0 md:bg-background md:px-5 md:py-[18px]">
        <CheckboxRow name="feeAcknowledged" required error={errors.feeAcknowledged}>
          I understand I pay a small booking fee only when I accept a renter
          <Required />
        </CheckboxRow>
        <CheckboxRow name="terms" required error={errors.terms}>
          <TermsText />
        </CheckboxRow>
      </div>
      <Actions back={ROUTES.ownerSignUp}>
        <Button type="submit" variant="yellow" size="lg" disabled={pending} className="flex-1 md:flex-none md:px-8">
          {pending ? "Creating your account…" : (
            <>
              <span className="md:hidden">Create account and list</span>
              <span className="hidden md:inline">Create account and list my first item →</span>
            </>
          )}
        </Button>
      </Actions>
    </form>
  );
}
