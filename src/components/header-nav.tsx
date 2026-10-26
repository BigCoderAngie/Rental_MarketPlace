"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { focusRingInsetClass } from "@/components/button";
import { HEADER_NAV } from "@/lib/site-links";

/** The header's main links; the one for the current page is green and underlined. */
export function HeaderNav({ current }: { current?: string }) {
  const pathname = usePathname();
  const active = current ?? pathname;
  return (
    <nav aria-label="Main" className="hidden flex-wrap gap-x-[26px] lg:flex">
      {HEADER_NAV.map((link) => {
        const on = !link.href.includes("#") && (active === link.href || active.startsWith(`${link.href}/`));
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={on ? "page" : undefined}
            className={`border-b-2 py-[22px] text-[15px] ${on ? "border-primary font-bold text-primary" : "border-transparent font-medium text-foreground-soft hover:text-primary"} ${focusRingInsetClass}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
