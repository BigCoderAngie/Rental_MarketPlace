import Link from "next/link";
import { buttonClass, focusRingClass, focusRingInsetClass, secondaryButtonClass } from "@/components/ui";

// Jump links use "/#..." so they also work from the terms and privacy pages.
const JUMP_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#plans", label: "Plans" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * The RentLoop mark: a loop of two arrows in a rounded square. Decorative; the
 * name always sits beside it. The square takes the text colour; `arrows` sets
 * the arrow colour (white on the green square, deep green on the white one).
 */
export function RentLoopMark({ className = "", arrows = "var(--primary-foreground)" }: { className?: string; arrows?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={`h-8 w-8 shrink-0 ${className}`}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <g fill="none" stroke={arrows} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 14a6.5 6.5 0 0 1 11.6-3.6M22.5 18a6.5 6.5 0 0 1-11.6 3.6" />
        <path d="M21.5 6.5v4.2h-4.2M10.5 25.5v-4.2h4.2" />
      </g>
    </svg>
  );
}

/**
 * The public top bar (docs/DESIGN.md "Top bar"): logo, jump links, Sign in and
 * Start free. Search, town, bell and avatar arrive with the Phase 2 marketplace.
 */
export function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 px-4 sm:min-h-16">
        <Link href="/" className={`mr-auto flex min-h-14 items-center gap-2 rounded text-lg font-bold tracking-tight text-foreground ${focusRingClass}`}>
          <RentLoopMark className="text-primary" />
          RentLoop
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
            <Link href="/calendar" className={`${buttonClass} ${focusRingClass}`}>
              Open the app
            </Link>
          ) : (
            <>
              <Link href="/login" className={`${secondaryButtonClass} ${focusRingClass}`}>
                Sign in
              </Link>
              {/* Phones get "Start free" in the homepage hero instead. */}
              <span className="hidden sm:inline-flex">
                <Link href="/login" className={`${buttonClass} ${focusRingClass}`}>
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
