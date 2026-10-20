import Link from "next/link";
import type { ReactNode } from "react";
import { cardLinkClass, focusRingClass } from "@/components/ui";

/**
 * A category with its icon in a pale green circle (docs/DESIGN.md "Category
 * tile"). Icons exist for the SRS categories (FR-IN-06); any other category
 * gets the grid.
 */
export function CategoryTile({ slug, label, href }: { slug: string; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`${cardLinkClass} flex min-h-28 flex-col items-center justify-start gap-2 p-3 pt-4 text-center ${focusRingClass}`}
    >
      <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon>{Object.hasOwn(ICONS, slug) ? ICONS[slug] : ICONS.other}</Icon>
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  // A marquee tent.
  events: <path d="M3 20h18M4 20l8-14 8 14M12 6V3M9 20l3-6 3 6" />,
  // A wrench.
  tools: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
  // A hard hat.
  "construction-machinery": (
    <>
      <path d="M3 18h18v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
      <path d="M5 15v-2a7 7 0 0 1 5-6.7M19 15v-2a7 7 0 0 0-5-6.7" />
      <path d="M10 11V5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V11" />
    </>
  ),
  // A 2 by 2 grid.
  other: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
};
