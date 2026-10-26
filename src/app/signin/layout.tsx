import Link from "next/link";
import type { ReactNode } from "react";
import { LineIcon } from "@/components/auth-fields";
import { Flag } from "@/components/flag";
import { CheckDot } from "@/components/icons";
import { Logo } from "@/components/logo";
import { ROUTES } from "@/lib/site-links";

const BENEFITS = [
  { title: "Free to request", line: "Renters never pay RentLoop", phone: "Free to request, renters never pay us", icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
  { title: "Earn from your things", line: "You set the price and approve every booking", phone: "Earn from your things, you set the price", icon: <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></> },
  { title: "Private until booked", line: "Names and numbers unlock only on acceptance", phone: "Private until booked", icon: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></> },
];

const focusOnDeep = "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground";

/**
 * Around every sign-in page (docs/build-kit/reference/desktop/SiteLogin.html
 * and mobile/SiteLogin.html). Desktop: one centred card, deep green on the
 * left with three benefits, the form on the right. Phones: a green block on
 * top and the form in a white card overlapping it. The kit's faint stock photo
 * behind the green side is left out (build kit decision 14).
 */
export default function SignInLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Phones */}
      <div className="flex flex-col gap-4 bg-deep px-5 pt-7 pb-[70px] text-deep-foreground md:hidden">
        <Link href={ROUTES.home} aria-label="RentLoop home" className={`self-start ${focusOnDeep}`}>
          <Logo onDeep className="text-[22px] [--mark:36px]" />
        </Link>
        <Headline className="mt-1.5 text-[32px]" />
        <ul className="flex flex-col gap-2">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex items-center gap-2.5 text-sm">
              <CheckDot />
              {b.phone}
            </li>
          ))}
        </ul>
      </div>

      <main className="md:wrap md:flex md:min-h-screen md:items-center md:justify-center md:py-12">
        <div className="md:flex md:w-full md:max-w-[1080px] md:flex-wrap md:overflow-hidden md:rounded-section md:bg-card md:shadow-[0_30px_80px_rgba(20,40,30,.14)]">
          <aside className="hidden flex-col gap-[26px] bg-deep px-[52px] py-14 text-deep-foreground md:flex md:flex-[1_1_420px]">
            <Link href={ROUTES.home} aria-label="RentLoop home" className={`self-start ${focusOnDeep}`}>
              <Logo onDeep className="text-[28px] [--mark:46px]" />
            </Link>
            <div>
              <Headline className="text-[40px]" />
              <p className="mt-3 text-base text-deep-muted">Your account for renting and earning, all over Namibia.</p>
            </div>
            <ul className="flex flex-col gap-[18px]">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-center gap-3.5">
                  <span aria-hidden className="flex h-12 w-12 flex-none items-center justify-center rounded-btn bg-white/10 text-accent">
                    <LineIcon>{b.icon}</LineIcon>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <strong className="text-base">{b.title}</strong>
                    <span className="text-sm text-deep-muted">{b.line}</span>
                  </span>
                </li>
              ))}
            </ul>
            <span className="mt-2 flex items-center gap-2.5 text-sm font-bold text-accent">
              <Flag width={22} />
              We only earn when you earn.
            </span>
          </aside>

          <section className="relative mx-4 -mt-[46px] mb-8 flex flex-col gap-[18px] rounded-card border border-border bg-card px-5 py-6 shadow-[0_20px_50px_rgba(20,40,30,.12)] md:m-0 md:flex-[1_1_440px] md:gap-[22px] md:rounded-none md:border-0 md:px-14 md:pt-14 md:pb-12 md:shadow-none">
            {children}
          </section>
        </div>
      </main>

      <p className="mx-4 mb-8 flex items-center justify-center gap-2 text-[13.5px] font-bold text-primary md:hidden">
        <Flag width={20} />
        We only earn when you earn.
      </p>
    </div>
  );
}

function Headline({ className }: { className: string }) {
  return (
    <h1 className={`leading-[1.08] font-extrabold tracking-[-0.02em] ${className}`}>
      Rent it today.
      <br />
      <span className="text-accent">Skip buying it.</span>
    </h1>
  );
}
