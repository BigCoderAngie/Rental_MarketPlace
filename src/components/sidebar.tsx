"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, mainLinks } from "@/components/app-nav";
import { focusRingInsetOnDeepClass as focusOnDeep } from "@/components/ui";
import { isActive } from "@/lib/nav";

/**
 * The deep green sidebar from the Owner Dashboard mockup (docs/DESIGN.md), for
 * screens 1024px and wider. Same menu and "current page" rules as the tab bar
 * and the top row.
 */
export function Sidebar({ businessName, isAdmin }: { businessName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const links = mainLinks(isAdmin);

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-deep text-deep-foreground lg:flex">
      <div className="px-3 pb-5 pt-4">
        {/* The staff home is the calendar until the Home page exists (home-dashboard). */}
        <Link href="/calendar" className={`flex min-h-11 items-center rounded-lg px-2 text-xl font-bold tracking-tight ${focusOnDeep}`}>
          RentLoop
        </Link>
        <p className="truncate px-2 text-sm text-deep-muted">{businessName}</p>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                    active ? "bg-primary text-primary-foreground" : "text-deep-muted hover:bg-deep-foreground/10 hover:text-deep-foreground"
                  } ${focusOnDeep}`}
                >
                  <NavIcon href={l.href} />
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/auth/signout" method="post" className="border-t border-deep-foreground/15 p-3">
        <button
          className={`flex min-h-11 w-full items-center rounded-lg px-3 text-sm font-medium text-deep-muted hover:bg-deep-foreground/10 hover:text-deep-foreground ${focusOnDeep}`}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
