import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { whatsAppLink } from "@/lib/whatsapp";

// A white focus ring: the usual green one barely shows on deep green.
const focusOnDeep = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground";
const footerLink = `inline-flex min-h-11 items-center rounded underline underline-offset-2 hover:text-deep-foreground ${focusOnDeep}`;

/**
 * The deep green footer strip (docs/DESIGN.md "Footer strip"). Trust items are
 * only things RentLoop really does; see DESIGN.md section 4 for the wording we
 * leave out (NFR-12), and nothing about verification or support hours yet. The
 * town picker arrives with the Phase 2 marketplace.
 */
export function SiteFooter() {
  return (
    <footer className="bg-deep text-deep-muted">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 text-center text-sm sm:text-left lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo onDeep className="text-[22px] [--mark:36px]" />
          <p>Booking software for Namibian hire businesses</p>
        </div>

        <ul className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:gap-6 lg:flex-col lg:items-start lg:gap-2">
          <Trust icon={<path d="M4 7h16v10H4zM4 11h16M8 15h3" />}>Your money goes straight to you</Trust>
          <Trust icon={<path d="M4 5h16v15H4zM4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" />}>No double bookings</Trust>
          <Trust icon={<path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" />}>Built for phones</Trust>
        </ul>

        <div className="flex flex-col items-center gap-1 sm:items-start lg:items-end">
          {SUPPORT_WHATSAPP ? (
            <a href={whatsAppLink("Hi, I have a question about RentLoop.", SUPPORT_WHATSAPP)} className={`${footerLink} font-medium text-deep-foreground`}>
              WhatsApp us on {SUPPORT_WHATSAPP}
            </a>
          ) : (
            <p className="min-h-11 content-center">WhatsApp: number coming soon (placeholder)</p>
          )}
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/terms" className={footerLink}>
              Terms
            </Link>
            <Link href="/privacy" className={footerLink}>
              Privacy
            </Link>
          </nav>
          <p>
            © {new Date().getFullYear()} RentLoop · Namibia
          </p>
        </div>
      </div>
    </footer>
  );
}

function Trust({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-deep-foreground">
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-deep-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {children}
    </li>
  );
}
