"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { focusRingInsetClass } from "@/components/ui";
import { MORE_HREF, TABS, isActive, isMoreActive, moreLinks, type TabHref } from "@/lib/nav";

// Client parts of the app layout: they need the current path to highlight
// where you are. The desktop sidebar (sidebar.tsx) uses the same menu and icons.

/** Top navigation row for screens 640 to 1023px wide (the sidebar takes over from 1024px). */
/** Every destination, in menu order: the tabs, then what sits behind More. Shared by the top row and the sidebar. */
export function mainLinks(isAdmin: boolean) {
  return [...TABS, ...moreLinks(isAdmin)];
}

export function TopNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = mainLinks(isAdmin);
  return (
    <nav aria-label="Main" className="hidden border-b border-border bg-card sm:block lg:hidden">
      <ul className="flex gap-1 overflow-x-auto px-2">
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                } ${focusRingInsetClass}`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Bottom tab bar for phones (under 640px). Sits above the iPhone home bar. */
export function BottomTabs() {
  const pathname = usePathname();
  const tabs: { href: TabHref; label: string; active: boolean }[] = [
    ...TABS.map((t) => ({ ...t, active: isActive(pathname, t.href) })),
    { href: MORE_HREF, label: "More", active: isMoreActive(pathname) },
  ];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] sm:hidden"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {tabs.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`relative flex min-h-(--tab-bar-height) flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                t.active ? "text-primary" : "text-muted-foreground"
              } ${focusRingInsetClass}`}
            >
              {t.active && <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />}
              <NavIcon href={t.href} />
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** The icon for a menu destination; shared by the tab bar and the sidebar. */
export function NavIcon({ href }: { href: string }) {
  // hasOwnProperty, not Object.hasOwn: older Safari and in-app browsers lack the latter.
  return Object.prototype.hasOwnProperty.call(ICONS, href) ? ICONS[href] : ICONS[MORE_HREF];
}

// Every tab must have an icon (a missing one fails the typecheck); the More pages add theirs below.
const TAB_ICONS: Record<TabHref, ReactNode> = {
  "/calendar": (
    <Icon>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  ),
  "/bookings": (
    <Icon>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </Icon>
  ),
  "/quotes": (
    <Icon>
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
      <path d="M9 11h6M9 14h4" />
    </Icon>
  ),
  "/customers": (
    <Icon>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </Icon>
  ),
  [MORE_HREF]: (
    <Icon>
      <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
    </Icon>
  ),
};

const ICONS: Record<string, ReactNode> = {
  ...TAB_ICONS,
  "/inventory": (
    <Icon>
      <path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z" />
      <path d="M3.5 8L12 12.5 20.5 8M12 12.5v8" />
    </Icon>
  ),
  "/reports": (
    <Icon>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </Icon>
  ),
  "/settings": (
    <Icon>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Icon>
  ),
  "/plan": (
    <Icon>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </Icon>
  ),
  "/admin": (
    <Icon>
      <path d="M12 3.5l7 2.8v5.4c0 4.3-3 7.6-7 8.8-4-1.2-7-4.5-7-8.8V6.3z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  ),
};
