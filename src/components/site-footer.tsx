import Link from "next/link";
import type { ReactNode } from "react";
import { RentLoopMark } from "@/components/top-bar";
import { focusRingOnDeepClass } from "@/components/ui";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { whatsAppLink } from "@/lib/whatsapp";

const footerLink = `inline-flex min-h-11 items-center rounded underline underline-offset-2 hover:text-deep-foreground ${focusRingOnDeepClass}`;

/**
 * The deep green footer (docs/build-kit 01-DESIGN-SYSTEM.md "Footer"). Desktop:
 * logo, description, motto, store buttons, three link columns, the slogan,
 * popular searches and a bar of trust ticks. Phones: the columns become
 * accordions, as in reference/mobile/SiteHome.html. Trust ticks are only things
 * RentLoop really does (NFR-12: nothing "protected", "secured" or "guaranteed").
 */
export function SiteFooter() {
  return (
    <footer className="bg-deep text-deep-muted">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-center text-sm sm:text-left lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="flex items-center gap-2 text-lg font-bold tracking-tight text-deep-foreground">
            <RentLoopMark className="text-deep-foreground" arrows="var(--deep)" />
            RentLoop
          </p>
          <p>Rent from people and hire businesses near you</p>
        </div>

        <div className="wrap pb-6 leading-loose text-deep-muted">
          <strong className="mr-2 text-[13px] text-deep-foreground">Popular searches</strong>
          {POPULAR_SEARCHES.map((q, i) => (
            <span key={q}>
              {i > 0 && " · "}
              <Link href={searchHref(q)} className={`text-[13px] hover:text-deep-foreground ${focusOnDeep}`}>
                {q}
              </Link>
            </span>
          ))}
        </div>

        <div className="border-t border-white/12">
          <div className="wrap flex flex-wrap gap-6 pt-4 pb-5 text-[13px] text-deep-muted">
            <span>© RentLoop, Windhoek</span>
            <span>✓ Renting is free</span>
            <span>✓ Owners approve every booking</span>
            <span>✓ Contact details private until booked</span>
            <span className="ml-auto flex items-center gap-2">
              <Flag width={20} />
              Namibia · English
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** The floating green "Need help?" pill, bottom right on desktop. Goes to the FAQ until there is a help page. */
export function HelpButton() {
  return (
    <a
      href={ROUTES.help}
      className={buttonClasses({ className: "fixed right-6 bottom-6 z-20 hidden rounded-full px-5 md:inline-flex" })}
    >
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v11H8l-4 4z" />
      </svg>
      Need help?
    </a>
  );
}
