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
    <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
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
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base focus:border-emerald-600 focus:outline-none";

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50";

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass}>
      {children}
    </Link>
  );
}
