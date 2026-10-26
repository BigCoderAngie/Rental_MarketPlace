import Link from "next/link";
import { focusRingClass } from "@/components/button";
import { ArrowRightIcon, ChevronDownIcon } from "@/components/icons";
import { CATEGORIES, ROUTES, categoryHref } from "@/lib/site-links";

/**
 * The row of category links under the header on signed-in pages (docs/build-kit
 * 01-DESIGN-SYSTEM.md "CategoryBar"), from 768px up. `current` is the slug to
 * highlight. The drop-down menus arrive with Explore (Part 5); for now each is a link.
 */
export function CategoryBar({ current }: { current?: string }) {
  return (
    <nav aria-label="Categories" className="hidden border-b border-border bg-card md:block">
      <div className="wrap flex min-h-[50px] items-center gap-1.5 overflow-x-auto">
        {CATEGORIES.map((c) => {
          const on = c.slug === current;
          return (
            <Link
              key={c.slug}
              href={categoryHref(c.slug)}
              aria-current={on ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1 rounded-[10px] px-3 py-2 text-sm font-semibold ${on ? "bg-primary-soft text-primary" : "text-foreground-soft hover:bg-muted"} ${focusRingClass}`}
            >
              {c.label}
              <span className="text-muted-foreground">
                <ChevronDownIcon size={10} />
              </span>
            </Link>
          );
        })}
        <Link href={ROUTES.explore} className={`ml-auto flex shrink-0 items-center gap-1 rounded py-2 pl-3 text-sm font-bold text-primary hover:text-primary-strong ${focusRingClass}`}>
          All categories
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </nav>
  );
}
