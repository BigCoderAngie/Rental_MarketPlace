"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/auth-fields";
import { Button, ButtonLink } from "@/components/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { StickyActions } from "@/components/signup-frame";
import { useSignupDraft } from "@/components/signup-draft";
import { hasErrors, validateAccount, type AccountInput, type Errors } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";

/**
 * Step 1 of both sign-up paths: name, email, mobile, password and confirm.
 * Nothing is sent yet: Next checks the fields and keeps them in memory for
 * step 2, where the account is created after the terms are ticked.
 */
export function AccountStep({ nextHref, privacyNote, backHref, backLabel }: { nextHref: string; privacyNote: string; backHref: string; backLabel: string }) {
  const router = useRouter();
  const { account, setAccount } = useSignupDraft();
  const [errors, setErrors] = useState<Errors<keyof AccountInput>>({});

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AccountInput = {
      fullName: String(form.get("fullName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      confirm: String(form.get("confirm") ?? ""),
    };
    const found = validateAccount(input);
    setErrors(found);
    if (hasErrors(found)) {
      // Take keyboard and screen reader users to the first problem.
      const first = Object.keys(found)[0];
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setAccount(input);
    router.push(nextHref);
  }

  return (
    <form noValidate onSubmit={next} className="flex flex-col gap-[18px] md:gap-[22px]">
      <div className="grid gap-[18px] md:grid-cols-2 md:gap-x-[22px]">
        <TextField label="Full name" name="fullName" required autoComplete="name" placeholder="Tangeni Amupolo" defaultValue={account?.fullName} error={errors.fullName} />
        <TextField label="Email address" name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={account?.email} error={errors.email} />
        <TextField label="Mobile number" name="phone" type="tel" required autoComplete="tel-national" inputMode="tel" prefix="+264" placeholder="81 234 5678" defaultValue={account?.phone} error={errors.phone} />
        <TextField label="Password" name="password" type="password" required autoComplete="new-password" placeholder="At least 8 characters" defaultValue={account?.password} error={errors.password} />
        <TextField label="Confirm password" name="confirm" type="password" required autoComplete="new-password" placeholder="Type it again" defaultValue={account?.confirm} error={errors.confirm} />
      </div>
      <p className="text-[13px] text-muted-foreground">{privacyNote}</p>
      <p className="text-center text-[15px] md:hidden">
        Already have an account?{" "}
        <Link href={ROUTES.signIn} className="font-bold text-primary underline">
          Sign in
        </Link>
      </p>
      <StickyActions>
        <ButtonLink href={backHref} variant="white" size="lg" className="hidden md:inline-flex">
          <ArrowLeftIcon />
          {backLabel}
        </ButtonLink>
        <Button type="submit" size="lg" className="w-full md:w-auto md:px-8">
          Next
          <ArrowRightIcon />
        </Button>
      </StickyActions>
    </form>
  );
}
