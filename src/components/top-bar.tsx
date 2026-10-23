import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonClass, focusRingClass, focusRingInsetClass, secondaryButtonClass } from "@/components/ui";

// Jump links use "/#..." so they also work from the terms and privacy pages.
const JUMP_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#plans", label: "Plans" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * The public top bar (docs/DESIGN.md "Top bar"): logo, jump links, Sign in and
 * Start free. Search, town, bell and avatar arrive with the Phase 2 marketplace.
 */
export function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 px-4 sm:min-h-16">
        <Link href="/" aria-label="RentLoop home" className={`mr-auto flex min-h-14 items-center rounded ${focusRingClass}`}>
          <Logo className="text-[19px] [--mark:32px] sm:text-[23px] sm:[--mark:38px]" />
        </Link>

        <nav
          aria-label="On this page"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-t border-border px-3 sm:order-none sm:mx-0 sm:w-auto sm:border-0 sm:px-0"
        >
          {JUMP_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`flex min-h-11 items-center whitespace-nowrap rounded px-2 text-sm font-medium text-foreground-soft hover:text-primary ${focusRingInsetClass}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/calendar" className={buttonClass}>
              Open the app
            </Link>
          ) : (
            <>
              <Link href="/login" className={secondaryButtonClass}>
                Sign in
              </Link>
              {/* Phones get "Start free" in the homepage hero instead. */}
              <span className="hidden sm:inline-flex">
                <Link href="/login" className={buttonClass}>
                  Start free
                </Link>
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
