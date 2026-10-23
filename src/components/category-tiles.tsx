import Link from "next/link";
import type { ReactNode } from "react";
import { focusRingClass } from "@/components/button";
import { CATEGORIES, categoryHref } from "@/lib/site-links";

// Line icons from the kit's category bar, keyed by category slug.
const ICONS: Record<string, ReactNode> = {
  tools: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  electronics: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7l2-3h4l2 3" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  events: <path d="M2 20h20M4 20L12 4l8 16M12 12l-3 8M12 12l3 8" />,
  "camping-outdoor": <path d="M3 20l6-10 4 6 3-4 5 8z" />,
  "construction-machinery": <path d="M2 18h20M4 18v-3a8 8 0 0 1 16 0v3M10 7V5h4v2" />,
  other: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
};

/**
 * The white floating card of lit category icons that overlaps the bottom of
 * the hero (docs/build-kit 03-PAGES-AND-ROUTES.md §1, item 4). The launch
 * categories only (MASTER-PLAN decision 10). Phones: the row scrolls sideways.
 */
export function CategoryTiles() {
  return (
    <nav
      aria-label="Categories"
      className="relative -mt-[22px] overflow-hidden rounded-[20px] bg-card py-4 pl-3 shadow-[0_12px_30px_rgba(20,40,30,.10)] md:-mt-9 md:rounded-[24px] md:px-5 md:py-[22px] md:shadow-[0_16px_40px_rgba(20,40,30,.10)]"
    >
      <div className="no-scrollbar -mr-4 flex gap-1.5 overflow-x-auto pr-4 md:mr-0 md:flex-wrap md:gap-2 md:overflow-visible md:pr-0">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={categoryHref(c.slug)}
            className={`flex min-w-[74px] flex-none flex-col items-center gap-2 rounded-card pb-1 text-[13px] font-semibold text-foreground-soft hover:text-primary md:min-w-20 md:flex-1 ${focusRingClass}`}
          >
            {/* The lit tile presses down when tapped. */}
            <span className="b3 flex h-[58px] w-[58px] items-center justify-center rounded-card border border-border bg-card text-primary-ink [--edge:var(--border)] [--glow:rgba(26,36,32,.06)] md:h-16 md:w-16">
              <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[c.slug] ?? ICONS.other}
              </svg>
            </span>
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
