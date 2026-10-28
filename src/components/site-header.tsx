import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { Avatar } from "@/components/avatar";
import { ButtonLink, focusRingClass } from "@/components/button";
import { HeaderNav } from "@/components/header-nav";
import { SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SiteMenu } from "@/components/site-menu";
import { ROUTES, type Viewer } from "@/lib/site-links";

/**
 * The sticky white header (docs/build-kit 01-DESIGN-SYSTEM.md "Header").
 * Signed out: Sign in and Sign up free, never List an item. Signed in: List an
 * item and the avatar with the first name, which opens the account menu. Phones: logo, Sign up or the avatar,
 * and the menu button. `current` overrides which nav link is underlined (the styleguide demo).
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

      {/* 768px and up: the kit's desktop row. From 768 to 1023px the nav folds into the menu button (build kit decision 7). */}
      <div className="wrap hidden min-h-[72px] items-center gap-x-4 md:flex lg:gap-x-7">
        <HomeLink className="text-[23px] [--mark:38px]" />
        <HeaderNav current={current} />
        <HeaderSearch />
        <div className="ml-auto flex flex-none items-center gap-3 py-3">
          {viewer ? (
            <>
              <ButtonLink href={ROUTES.listItem} size="sm">
                List an item
              </ButtonLink>
              <AccountMenu name={viewer.name} lists={Boolean(viewer.lists)} />
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
          <span className="lg:hidden">
            <SiteMenu viewer={viewer} />
          </span>
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

/** The header search goes to Explore with the words in ?q=. Hidden from 1024 to 1279px, where the full nav needs the room. */
function HeaderSearch() {
  return (
    <form action={ROUTES.explore} role="search" className="flex min-w-0 flex-1 lg:hidden xl:flex">
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
