import Link from "next/link";
import { focusRingClass } from "@/components/ui";

/** "View all →" beside a section title (docs/DESIGN.md). At least 44px to tap; the arrow is hidden from screen readers. */
export function ViewAllLink({ href, children = "View all" }: { href: string; children?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold text-primary hover:text-primary-strong ${focusRingClass}`}
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}
