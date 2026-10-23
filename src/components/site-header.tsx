import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ButtonLink, focusRingClass, focusRingInsetClass } from "@/components/button";
import { SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SiteMenu } from "@/components/site-menu";
import { HEADER_NAV, ROUTES, type Viewer } from "@/lib/site-links";

/**
 * The sticky white header (docs/build-kit 01-DESIGN-SYSTEM.md "Header").
 * Signed out: Sign in and Sign up free, never List an item. Signed in: List an
 * item and the avatar with the first name. Phones: logo, Sign up or the avatar,
 * and the menu button. `current` is the nav link to underline.
 */
export function SiteHeader({ viewer, current }: { viewer: Viewer; current?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      {/* Phones (below 768px): 62px tall. */}
      <div className="flex h-[62px] items-center gap-2 px-4 md:hidden">
        <HomeLink className="text-[19px] [--mark:32px]" />
        <span className="flex-1" />
        {viewer ? (
          <Link href={ROUTES.myBookings} aria-label={`Your bookings, ${viewer.name}`} className={`rounded-full ${focusRingClass}`}>
            <Avatar name={viewer.name} small />
          </Link>
        ) : (
          <ButtonLink href={ROUTES.join} variant="yellow" size="sm" className="px-3.5">
            Sign up
          </ButtonLink>
        )}
        <SiteMenu viewer={viewer} />
      </div>

      {/* 768px and up: the kit's desktop row; it wraps onto two lines on narrow screens. */}
      <div className="wrap hidden min-h-[72px] flex-wrap items-center gap-x-7 md:flex">
        <HomeLink className="text-[23px] [--mark:38px]" />
        <nav aria-label="Main" className="flex flex-wrap gap-x-[26px]">
          {HEADER_NAV.map((link) => {
            const on = link.href === current;
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
        <HeaderSearch />
        <div className="flex items-center gap-3 py-3">
          {viewer ? (
            <>
              <ButtonLink href={ROUTES.listItem} size="sm">
                List an item
              </ButtonLink>
              <Link href={ROUTES.myBookings} className={`flex items-center gap-2.5 rounded-full font-semibold text-foreground ${focusRingClass}`}>
                <Avatar name={viewer.name} />
                {viewer.name}
              </Link>
            </>
          ) : (
            <>
              <ButtonLink href={ROUTES.signIn} variant="white" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href={ROUTES.join} variant="yellow" size="sm">
                Sign up free
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HomeLink({ className }: { className: string }) {
  return (
    <Link href={ROUTES.home} aria-label="RentLoop home" className={`flex items-center rounded ${focusRingClass}`}>
      <Logo className={className} />
    </Link>
  );
}

/** The header search goes to Explore (Part 5) with the words in ?q=. */
function HeaderSearch() {
  return (
    <form action={ROUTES.explore} role="search" className="flex min-w-0 flex-[1_1_240px]">
      <label className="flex h-[46px] w-full items-center gap-2.5 rounded-input border border-input bg-card px-4 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
        <SearchIcon />
        <span className="sr-only">Search</span>
        <input
          type="search"
          name="q"
          placeholder="Search for anything to rent…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>
    </form>
  );
}
