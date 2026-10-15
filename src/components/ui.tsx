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

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-strong";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground-soft hover:bg-muted";

// Visible keyboard focus for links and buttons.
export const focusRingClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Same, drawn just inside the edge, for items in scrolling or rounded clipped lists where an outer ring would be cut off.
export const focusRingInsetClass = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

// Marigold fill with accent-foreground text (7.4:1); marigold is never a text colour.
export const upgradeBadgeClass =
  "inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground hover:bg-accent/85";

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass}>
      {children}
    </Link>
  );
}
