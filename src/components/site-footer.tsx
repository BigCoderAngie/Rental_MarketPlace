import Link from "next/link";
import { buttonClasses } from "@/components/button";
import { Flag } from "@/components/flag";
import { Logo } from "@/components/logo";
import { StoreButtons } from "@/components/store-buttons";
import { FOOTER_COLUMNS, PHONE_HIDDEN_FOOTER_LINKS, POPULAR_SEARCHES, ROUTES, searchHref } from "@/lib/site-links";

// A white focus ring: the usual green one barely shows on deep green.
const focusOnDeep = "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground";
const footerLink = `text-sm text-deep-muted hover:text-deep-foreground ${focusOnDeep}`;

/**
 * The deep green footer (docs/build-kit 01-DESIGN-SYSTEM.md "Footer"). Desktop:
 * logo, description, motto, store buttons, three link columns, the slogan,
 * popular searches and a bar of trust ticks. Phones: the columns become
 * accordions, as in reference/mobile/SiteHome.html. Trust ticks are only things
 * RentLoop really does (NFR-12: nothing "protected", "secured" or "guaranteed").
 */
export function SiteFooter() {
  return (
    <footer className="bg-deep text-deep-foreground">
      {/* Phones */}
      <div className="flex flex-col gap-4 px-4 pt-8 pb-10 md:hidden">
        <Logo onDeep className="text-[22px] [--mark:36px]" />
        <strong className="text-base text-accent">We only earn when you earn.</strong>
        <StoreButtons onDeep stacked />
        <div className="border-t border-white/15">
          {FOOTER_COLUMNS.map((col) => (
            <details key={col.title} className="group border-b border-white/15">
              <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between text-[15px] font-bold ${focusOnDeep}`}>
                {col.title}
                <span aria-hidden className="text-deep-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
                  ▾
                </span>
              </summary>
              <div className="flex flex-col gap-1 pb-3.5">
                {col.links
                  .filter((link) => !PHONE_HIDDEN_FOOTER_LINKS.has(link.label))
                  .map((link) => (
                    <Link key={link.label} href={link.href} className={`flex min-h-10 items-center ${footerLink}`}>
                      {link.label}
                    </Link>
                  ))}
              </div>
            </details>
          ))}
        </div>
        <span className="text-2xl leading-[1.15] font-extrabold text-on-deep-2 italic">More sharing. Less buying.</span>
        <span className="flex items-center gap-2.5 text-[13px] text-deep-muted">
          <Flag width={22} />
          Proudly Namibian · © RentLoop, Windhoek
        </span>
      </div>

      {/* 768px and up */}
      <div className="hidden md:block">
        <div className="wrap flex flex-wrap gap-x-14 gap-y-10 pt-[52px] pb-9">
          <div className="flex flex-[1_1_300px] flex-col gap-3">
            <Logo onDeep className="text-2xl [--mark:38px]" />
            <span className="max-w-[300px] text-sm leading-normal text-deep-muted">
              Rent almost anything from people and hire businesses near you, all over Namibia.
            </span>
            <strong className="text-base text-accent">We only earn when you earn.</strong>
            <div className="mt-1.5">
              <StoreButtons onDeep />
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex min-w-[140px] flex-col gap-2.5">
              <strong className="text-sm">{col.title}</strong>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className={`self-start ${footerLink}`}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="flex flex-[1_1_200px] flex-col gap-3">
            <span className="text-[28px] leading-[1.15] font-extrabold text-on-deep-2 italic">
              More sharing.
              <br />
              Less buying.
            </span>
            <span className="flex items-center gap-2.5 text-sm text-primary-soft">
              <Flag width={22} />
              Proudly Namibian
            </span>
          </div>
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
