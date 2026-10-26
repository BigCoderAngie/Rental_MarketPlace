import Link from "next/link";
import { buttonClasses } from "@/components/button";
import type { ReactNode } from "react";

// Small shared building blocks so screens look the same. Mobile first:
// full-width controls, large tap targets.

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink">
      {message}
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base focus:border-primary focus:outline-none";

// The focus rings live with the Button; re-exported here for existing imports.
export { focusRingClass, focusRingInsetClass } from "@/components/button";

// Buttons for the business pages and customer links: the kit's lit press-down
// Button, at least 48px tall (NFR-08), allowed to wrap for long business names.
export const buttonClass = buttonClasses({ variant: "green", wrap: true });

export const secondaryButtonClass = buttonClasses({ variant: "white", wrap: true });

/** The card look from the build kit: 18px corners (rounded-card), warm border, white on the cream page, soft shadow. */
export const cardClass = "rounded-card border border-border bg-card shadow-sm";

/** A card you tap: lifts a little on hover (desktop), under 200ms, no motion when it's turned off. Callers set the display (flex, block). */
export const cardLinkClass = `${cardClass} transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0`;

// Yellow fill with accent-foreground text (7.6:1); yellow is never a text colour on light backgrounds.
export const upgradeBadgeClass =
  "inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground hover:bg-accent/85";

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass}>
      {children}
    </Link>
  );
}

/** A list with nothing in it yet: one sentence about what goes here, and a button to add the first one. */
export function EmptyState({ message, actionHref, actionLabel }: { message: string; actionHref: string; actionLabel: string }) {
  return (
    <div className={`${cardClass} p-5`}>
      <p className="text-foreground-soft">{message}</p>
      <div className="mt-4">
        <LinkButton href={actionHref}>{actionLabel}</LinkButton>
      </div>
    </div>
  );
}
