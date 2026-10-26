// Links in the public shell: top strip, header, phone menu, category bar and
// footer (docs/build-kit/reference/desktop/SiteHome.html and SiteExplore.html).
// Routes follow docs/build-kit/03-PAGES-AND-ROUTES.md. Pages that are not built
// Owner links point at sign-up with List an item next; signed-in people who
// follow them go straight to List an item (proxy.ts).

export type SiteLink = { href: string; label: string };

/** Who is signed in, for the header and phone menu: null for visitors. */
export type Viewer = { name: string } | null;

export const ROUTES = {
  home: "/",
  explore: "/explore", // Part 5
  signIn: "/signin",
  // One sign-up for everyone ("Sign up free"; /join forwards here).
  join: "/signup",
  // Owner links sign up, then go to List an item, which asks the owner questions first.
  ownerSignUp: "/signup?next=%2Fowner%2Flist",
  welcome: "/welcome",
  listItem: "/owner/list", // Part 8
  myBookings: "/my/bookings", // Part 7
  owner: "/owner", // Part 8
  howItWorks: "/#how",
  help: "/#faq",
  getApp: "/#app",
  terms: "/terms",
} as const;

export const HEADER_NAV: SiteLink[] = [
  { href: ROUTES.explore, label: "Browse" },
  { href: ROUTES.howItWorks, label: "How it works" },
  { href: ROUTES.ownerSignUp, label: "For businesses" },
  { href: ROUTES.help, label: "Help" },
];

/**
 * The launch categories (MASTER-PLAN decision 4, FR-IN-06), with the short
 * labels the kit's category bar uses. No Vehicles, Homes or Rooms at launch.
 */
export const CATEGORIES: { slug: string; label: string }[] = [
  { slug: "events", label: "Events" },
  { slug: "tools", label: "Tools" },
  { slug: "construction-machinery", label: "Building" },
  { slug: "electronics", label: "Electronics" },
  { slug: "camping-outdoor", label: "Camping" },
  { slug: "other", label: "Other" },
];

export function categoryHref(slug: string): string {
  return `${ROUTES.explore}?cat=${encodeURIComponent(slug)}`;
}

export const FOOTER_COLUMNS: { title: string; links: SiteLink[] }[] = [
  {
    title: "Rent",
    links: [
      { href: ROUTES.explore, label: "Browse" },
      { href: ROUTES.howItWorks, label: "How it works" },
      { href: ROUTES.explore, label: "All categories" },
      { href: ROUTES.getApp, label: "Get the app" },
    ],
  },
  {
    title: "Earn",
    links: [
      { href: ROUTES.ownerSignUp, label: "List an item" },
      { href: ROUTES.ownerSignUp, label: "For hire businesses" },
      { href: ROUTES.help, label: "How the booking fee works" },
    ],
  },
  {
    title: "RentLoop",
    links: [
      { href: ROUTES.help, label: "About" },
      { href: ROUTES.help, label: "Help and FAQ" },
      { href: ROUTES.help, label: "Trust and safety" },
      { href: ROUTES.terms, label: "Terms and privacy" },
    ],
  },
];

/** On phones the footer accordions leave out "All categories" and "Trust and safety", as in the phone reference. */
export const PHONE_HIDDEN_FOOTER_LINKS = new Set(["All categories", "Trust and safety"]);

// The kit's list without car hire, bakkie hire and rooms (not at launch).
export const POPULAR_SEARCHES = [
  "Camera rental",
  "Wedding marquees",
  "Tent hire",
  "PA speakers",
  "Generators",
  "Power tools",
  "Concrete mixers",
  "Camping gear",
  "Laptops",
];

/** The launch towns search covers (MASTER-PLAN decision 10). */
export const SEARCH_TOWNS = ["Windhoek", "Swakopmund", "Walvis Bay"];

export function searchHref(q: string): string {
  return `${ROUTES.explore}?q=${encodeURIComponent(q)}`;
}

/** Up to two capital letters for the avatar circle: "Tangeni Amupolo" → "TA", "tangeni" → "T". */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase());
  return letters.join("") || "?";
}

/** The first name shown beside the avatar, from the sign-up name or else the email before the @. */
export function displayName(fullName: string | undefined | null, email: string | undefined | null): string {
  const first = fullName?.trim().split(/\s+/)[0];
  if (first) return first;
  const local = email?.split("@")[0]?.trim();
  return local || "You";
}
