"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

const focusOnDeep = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground";

type NavItem = { href: string; label: string; badge?: number };

/**
 * The deep green sidebar of the renter and owner areas (SiteBookings.html,
 * SiteOwner.html): logo, the Renter / Owner switch, the menu and the motto.
 * Hire businesses also get their business tools (build kit decision 9). No
 * Messages page (decision 12).
 */
export function AccountSidebar({ waiting, hasBusiness, isHireBusiness }: { waiting: number; hasBusiness: boolean; isHireBusiness: boolean }) {
  const pathname = usePathname();
  const owner = pathname.startsWith("/owner");

  const renterNav: NavItem[] = [
    { href: "/my/bookings", label: "My bookings" },
    { href: "/explore", label: "Browse" },
    { href: "/#faq", label: "Help and problems" },
  ];
  const ownerNav: NavItem[] = [
    { href: "/owner", label: "Dashboard" },
    { href: "/owner/requests", label: "Booking requests", badge: waiting },
    { href: "/owner/list", label: "List an item" },
    ...(isHireBusiness
      ? [
          { href: "/calendar", label: "Calendar" },
          { href: "/quotes", label: "Quotes" },
          { href: "/customers", label: "Customers" },
          { href: "/reports", label: "Reports" },
        ]
      : []),
    ...(hasBusiness ? [{ href: "/plan", label: "Plan" }] : []),
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] flex-none flex-col gap-[18px] overflow-y-auto bg-deep px-[18px] py-6 text-deep-foreground lg:flex">
      <Link href="/" aria-label="RentLoop home" className={`self-start rounded ${focusOnDeep}`}>
        <Logo onDeep className="text-[23px] [--mark:38px]" />
      </Link>
      <ModeSwitch owner={owner} dark />
      <nav aria-label={owner ? "Owner" : "Renter"} className="flex flex-col gap-1">
        {(owner ? ownerNav : renterNav).map((item) => {
          const on = item.href === pathname;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`flex items-center justify-between rounded-btn-sm px-3.5 py-3 text-[14.5px] ${on ? "bg-primary font-bold text-primary-foreground" : "font-medium text-primary-soft hover:text-deep-foreground"} ${focusOnDeep}`}
            >
              {item.label}
              {item.badge ? <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-danger-foreground">{item.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto rounded-card bg-deep-2 px-3.5 py-4 text-[13px] leading-normal text-primary-soft">
        <strong className="block text-accent">We only earn when you earn.</strong>
        Renting is free. Owners pay a small fee only when they accept a booking.
      </p>
    </aside>
  );
}

/** Renter / Owner (desktop sidebar) or Renting / Lending (phones). */
export function ModeSwitch({ owner, dark = false }: { owner: boolean; dark?: boolean }) {
  const base = "flex-1 rounded-[10px] py-2.5 text-center text-sm font-semibold";
  const on = dark ? "bg-card text-deep" : "b3 rl-g text-primary-foreground";
  const off = dark ? `text-deep-muted hover:text-deep-foreground ${focusOnDeep}` : "text-foreground-soft focus-visible:outline-2 focus-visible:outline-primary";
  return (
    <nav aria-label="Switch area" className={`flex gap-1 rounded-btn p-1 ${dark ? "bg-deep-2" : "border border-border bg-card"}`}>
      <Link href="/my/bookings" aria-current={!owner ? "page" : undefined} className={`${base} ${!owner ? on : off}`}>
        {dark ? "Renter" : "Renting"}
      </Link>
      <Link href="/owner" aria-current={owner ? "page" : undefined} className={`${base} ${owner ? on : off}`}>
        {dark ? "Owner" : "Lending"}
      </Link>
    </nav>
  );
}
