"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { saveOwnerSetup, type OwnerSetupState } from "@/app/(focus)/owner/setup/actions";
import { FormMessage } from "@/components/auth-fields";
import { Button, ButtonLink } from "@/components/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { OwnerQuestions } from "@/components/owner-questions";
import { StickyActions } from "@/components/signup-frame";
import { ROUTES } from "@/lib/site-links";

/** The form on "Before you list": the owner questions, the fee box and Continue. */
export function OwnerSetupForm() {
  const [state, formAction, pending] = useActionState<OwnerSetupState, FormData>(saveOwnerSetup, {});

  // Call the action ourselves so a server problem doesn't clear the choices (React resets forms after a form action).
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => formAction(form));
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-[18px] md:gap-[22px]">
      <FormMessage message={state.message} />
      <OwnerQuestions errors={state.errors ?? {}} />
      <StickyActions>
        <ButtonLink href={ROUTES.home} variant="white" size="lg" aria-label="Not now" className="w-14 flex-none px-0 md:w-auto md:px-[22px]">
          <ArrowLeftIcon />
          <span className="hidden md:inline">Not now</span>
        </ButtonLink>
        <Button type="submit" variant="yellow" size="lg" disabled={pending} className="flex-1 md:flex-none md:px-8">
          {pending ? "Saving…" : "Continue to my listing"}
          {!pending && <ArrowRightIcon />}
        </Button>
      </StickyActions>
    </form>
  );
}
