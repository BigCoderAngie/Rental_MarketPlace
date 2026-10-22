import Link from "next/link";
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

// Visible keyboard focus for links and buttons.
export const focusRingClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Same, drawn just inside the edge, for items in scrolling or rounded clipped lists where an outer ring would be cut off.
export const focusRingInsetClass = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

// Buttons: at least 44px tall (NFR-08), a pressed look, and no motion for people who turn it off.
const buttonBase =
  `inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-[background-color,transform] duration-150 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 ${focusRingClass}`;

export const buttonClass = `${buttonBase} bg-primary text-primary-foreground hover:bg-primary-strong active:bg-primary-strong`;

export const secondaryButtonClass = `${buttonBase} border border-border bg-card text-foreground-soft hover:bg-muted active:bg-muted`;

/** The card look from docs/DESIGN.md: 12px corners, light border, white, soft shadow. */
export const cardClass = "rounded-xl border border-border bg-card shadow-sm";

/** A card you tap: lifts a little on hover (desktop), under 200ms, no motion when it's turned off. Callers set the display (flex, block). */
export const cardLinkClass = `${cardClass} transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0`;

// Star yellow fill with accent-foreground text (9.1:1); star yellow is never a text colour.
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
