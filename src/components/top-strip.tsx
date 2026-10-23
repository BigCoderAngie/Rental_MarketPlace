import Link from "next/link";
import { Flag } from "@/components/flag";
import { ROUTES } from "@/lib/site-links";

// Links on deep green: white focus ring, as the green one barely shows.
const focusOnDeep = "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground";

/**
 * The deep green strip above the header (docs/build-kit 01-DESIGN-SYSTEM.md
 * "TopStrip"). Desktop: town, the motto in yellow, Get the app, For hire
 * businesses, Help. Phones: flag and the short motto only.
 */
export function TopStrip() {
  return (
    <div className="bg-deep text-[13px] text-primary-soft">
      <div className="wrap hidden min-h-10 flex-wrap items-center gap-x-[22px] md:flex">
        {/* The town picker arrives with search (Part 5); for now it only shows the town. */}
        <span className="flex items-center gap-2 py-2 font-semibold text-deep-foreground">
          <Flag width={20} />
          Windhoek, Namibia
        </span>
        <span className="flex items-center gap-2 font-bold text-accent">
          <CheckCircle />
          We only earn when you earn.
          {/* Kept to one line on tablets. */}
          <span className="-ml-1 hidden lg:inline">Renting and listing are free.</span>
        </span>
        <span className="ml-auto flex items-center gap-5">
          <a href={ROUTES.getApp} className={`flex items-center gap-1.5 py-2 font-semibold text-deep-foreground ${focusOnDeep}`}>
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="2" width="10" height="20" rx="2.5" />
              <path d="M11 18h2" />
            </svg>
            Get the app
          </a>
          <Link href={ROUTES.ownerSignUp} className={`py-2 hover:text-deep-foreground ${focusOnDeep}`}>
            For hire businesses
          </Link>
          <a href={ROUTES.help} className={`py-2 hover:text-deep-foreground ${focusOnDeep}`}>
            Help
          </a>
        </span>
      </div>
      <p className="flex h-[34px] items-center justify-center gap-2 text-[12.5px] font-bold text-accent md:hidden">
        <Flag width={20} />
        We only earn when you earn
      </p>
    </div>
  );
}

function CheckCircle() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}
