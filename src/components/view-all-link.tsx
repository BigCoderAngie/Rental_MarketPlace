import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { focusRingClass } from "@/components/ui";

/** "View all" with an arrow beside a section title (docs/DESIGN.md). At least 44px to tap; the arrow is hidden from screen readers. */
export function ViewAllLink({ href, children = "View all" }: { href: string; children?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold text-primary hover:text-primary-strong ${focusRingClass}`}
    >
      {children}
      <ArrowRightIcon size={14} />
    </Link>
  );
}
