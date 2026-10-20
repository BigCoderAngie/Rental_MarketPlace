// Where the app's navigation goes. The bottom tab bar (phones) shows TABS;
// everything in MORE_LINKS sits behind the "More" tab. The top row (wider
// screens) shows both.

export type NavLink = { href: string; label: string };

export const TABS = [
  { href: "/calendar", label: "Calendar" },
  { href: "/bookings", label: "Bookings" },
  { href: "/quotes", label: "Quotes" },
  { href: "/customers", label: "Customers" },
] as const satisfies readonly NavLink[];

export const MORE_HREF = "/more";

/** Every tab in the bottom bar; each needs an icon (app-nav.tsx won't compile without one). */
export type TabHref = (typeof TABS)[number]["href"] | typeof MORE_HREF;

export const MORE_LINKS: NavLink[] = [
  { href: "/inventory", label: "Inventory" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
  { href: "/plan", label: "Your plan" },
];

/** Admin lives outside the app layout, so it is only a link, shown to platform admins. */
export const ADMIN_LINK: NavLink = { href: "/admin", label: "Admin" };

/** What sits behind "More": Admin is added for platform admins only. */
export function moreLinks(isAdmin: boolean): NavLink[] {
  return isAdmin ? [...MORE_LINKS, ADMIN_LINK] : MORE_LINKS;
}

/** True when the page at `pathname` belongs to the section at `href` (its own page or anything below it). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The "More" tab is active on its own page and on every page it links to. */
export function isMoreActive(pathname: string): boolean {
  return isActive(pathname, MORE_HREF) || MORE_LINKS.some((l) => isActive(pathname, l.href));
}
