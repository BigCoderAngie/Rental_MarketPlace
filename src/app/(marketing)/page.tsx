import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass, focusRingClass, secondaryButtonClass, upgradeBadgeClass } from "@/components/ui";
import { FAQ } from "@/lib/faq";
import { formatNad } from "@/lib/money";
import { formatDateWithYear } from "@/lib/dates";
import { bookingFeeText, loadLaunchEndsOn, loadPlans, planFeatures } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

const DESCRIPTION =
  "Stop double bookings and send quotes on WhatsApp. Stock, bookings, deposits and returns for tent, chair and event hire businesses in Namibia. Free plan, prices in N$.";

export const metadata: Metadata = {
  title: "Booking software for Namibian hire businesses | RentLoop",
  description: DESCRIPTION,
  openGraph: {
    title: "Stop double bookings. Send quotes on WhatsApp.",
    description: DESCRIPTION,
    type: "website",
    locale: "en_NA",
    siteName: "RentLoop",
  },
};

const TRUST = ["Your money goes straight to you", "Works on WhatsApp", "No double bookings", "Built for phones"];

const STEPS = [
  {
    title: "Add your items and packages",
    body: "Enter what you rent, how many you own and the price per day. Group items into packages like \"Wedding 100\".",
  },
  {
    title: "Send a quote on WhatsApp",
    body: "Pick the dates and items; the app shows what is free. Send the quote link to your customer in one tap.",
  },
  {
    title: "Customer accepts and you track the booking",
    body: "They accept on their phone. You confirm it, record payments and deposits, and count items out and back in.",
  },
];

const COMPARISON = [
  {
    topic: "Double bookings",
    notebook: "Two people write the same tent down for the same Saturday.",
    app: "Shows what is free before you accept, and refuses a booking that would leave you short.",
  },
  {
    topic: "Deposits",
    notebook: "Who paid what is somewhere in a chat thread.",
    app: "Every deposit received, returned or kept is recorded, and the customer confirms it.",
  },
  {
    topic: "Overdue returns",
    notebook: "You notice the chairs are missing when the next customer arrives.",
    app: "Bookings past their return date are marked Overdue every night.",
  },
  {
    topic: "Reports",
    notebook: "Adding up the month means going back through every page.",
    app: "Money and bookings for any dates, with item use and who still owes you on Pro and Business.",
  },
];

/** The public homepage. proxy.ts sends signed-in users to their calendar instead. */
export default async function HomePage() {
  const supabase = await createClient();
  const [plans, launchEndsOn] = await Promise.all([loadPlans(supabase), loadLaunchEndsOn(supabase)]);
  // Only offer founding prices while the launch is on (mirrors plan_price() in the database).
  // The database decides founding prices on the UTC date a business is created, so compare the same date.
  const launchOn = launchEndsOn != null && new Date().toISOString().slice(0, 10) <= launchEndsOn;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-5xl gap-10 px-4 pb-14 pt-10 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className="text-sm text-muted-foreground">Booking software for Namibian hire businesses</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="block">Stop double bookings.</span>
            <span className="block">Send quotes on WhatsApp.</span>
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className={buttonClass}>
              Start free
            </Link>
            <a href="#how-it-works" className={secondaryButtonClass}>
              See how it works
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Free plan. No card needed. Prices in N$.</p>
        </div>
        <QuoteOnWhatsApp />
      </section>

      {/* Trust strip */}
      <section aria-label="Why hire businesses use it" className="border-y border-border bg-card">
        <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-x-6 gap-y-3 px-4 py-5 text-sm font-medium sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <Section id="how-it-works" title="How it works">
        <ol className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden className="block text-5xl font-semibold leading-none text-primary">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-foreground-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Notebook vs app */}
      <Section id="compare" title="Why not just WhatsApp and a notebook?">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[10rem_1fr_1fr] gap-6 border-b border-border px-5 py-3 text-sm font-semibold text-muted-foreground sm:grid">
            <span />
            <span>WhatsApp and a notebook</span>
            <span className="text-foreground">RentLoop</span>
          </div>
          <dl className="divide-y divide-border">
            {COMPARISON.map((row) => (
              <div key={row.topic} className="grid gap-2 px-5 py-4 sm:grid-cols-[10rem_1fr_1fr] sm:gap-6">
                <dt className="font-semibold">{row.topic}</dt>
                <dd className="flex gap-2 text-muted-foreground">
                  <span aria-hidden className="select-none">–</span>
                  <span>
                    <span className="font-medium sm:sr-only">Notebook: </span>
                    {row.notebook}
                  </span>
                </dd>
                <dd className="flex gap-2">
                  <Check />
                  <span>
                    <span className="font-medium sm:sr-only">This app: </span>
                    {row.app}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* Plans */}
      <Section id="plans" title="Plans" intro="Launch prices, may change. Pay yearly by bank deposit or eWallet.">
        {plans.length === 0 ? (
          <p className="text-foreground-soft">Plans and prices are coming soon. You can start on the Free plan today.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => {
              const founding = launchOn && Number(p.founding_price) < Number(p.yearly_price);
              return (
                <li key={p.code} className="flex flex-col rounded-xl border border-border bg-card p-5">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{formatNad(p.yearly_price)} a year</p>
                  {founding && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className={upgradeBadgeClass}>Founding price {formatNad(p.founding_price)}</span> for your
                      first year if you join by {formatDateWithYear(launchEndsOn!)}
                    </p>
                  )}
                  <ul className="mt-4 space-y-1 text-sm text-foreground-soft">
                    {planFeatures(p).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                    <li className="text-muted-foreground">{bookingFeeText(p)}</li>
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-6">
          <Link href="/login" className={buttonClass}>
            Start free
          </Link>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Questions">
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {FAQ.map((f) => (
            <details key={f.question} className="group px-5">
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden ${focusRingClass}`}
              >
                {f.question}
                <span aria-hidden className="text-xl leading-none text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="max-w-[65ch] pb-5 text-foreground-soft">{f.answer}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-5xl scroll-mt-28 px-4 py-14 sm:py-20">
      <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The hero picture: a quote as a customer receives it on WhatsApp. Decorative, not interactive. */
function QuoteOnWhatsApp() {
  const lines: [string, number][] = [
    ["1 × Stretch tent 10x15m", 1200],
    ["100 × White plastic chair", 800],
    ["10 × Trestle table 1.8m", 450],
  ];
  const total = lines.reduce((sum, [, amount]) => sum + amount, 0);
  return (
    <figure className="mx-auto w-full max-w-sm">
      <div className="rounded-[1.75rem] border border-border bg-muted p-3">
        <p className="px-2 pb-2 pt-1 text-sm font-semibold">Kalahari Tent &amp; Chair Hire</p>
        <div className="ml-6 rounded-2xl rounded-tr-sm bg-primary-soft p-3 text-sm text-primary-ink">
          <p>Hi Nomsa, here is your quote for the wedding on Sat, 24 Oct.</p>
          <div className="mt-2 rounded-xl border border-primary-border bg-card p-3 text-foreground">
            <p className="font-semibold">Quote QT-000014</p>
            <ul className="mt-2 space-y-1">
              {lines.map(([item, price]) => (
                <li key={item} className="flex justify-between gap-3">
                  <span>{item}</span>
                  <span className="shrink-0">{formatNad(price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span>{formatNad(total)}</span>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>Deposit</span>
              <span>{formatNad(2000)}</span>
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-primary">
              <Check />
              Everything is free on Sat, 24 Oct
            </p>
            <span className="mt-3 block rounded-lg bg-primary py-2 text-center font-semibold text-primary-foreground">
              Accept quote
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">09:14</p>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted-foreground">
        What your customer sees: one link, no account needed.
      </figcaption>
    </figure>
  );
}
