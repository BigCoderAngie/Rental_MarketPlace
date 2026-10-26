import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CategoryTile } from "@/components/category-tile";
import {
  CheckIcon,
  accentButtonOnDeepClass,
  buttonClass,
  focusRingClass,
  inputClass,
  outlineOnDeepClass,
  secondaryButtonOnDeepClass,
  upgradeBadgeClass,
} from "@/components/ui";
import { CATEGORIES, POPULAR_SEARCHES, SEARCH_TOWNS, searchHref } from "@/lib/categories";
import { OWNER_FAQ, RENTER_FAQ, type Faq } from "@/lib/faq";
import { formatNad } from "@/lib/money";
import { formatDateWithYear, namibiaToday } from "@/lib/dates";
import { bookingFeeText, launchIsOn, loadLaunchEndsOn, loadPlans, planFeatures } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

const DESCRIPTION =
  "Rent tents, tools, cameras and event gear from people and hire businesses in Windhoek and Erongo. Requests are free and you pay the owner directly.";

export const metadata: Metadata = {
  title: "RentLoop: rent it nearby instead of buying it | Namibia",
  description: DESCRIPTION,
  openGraph: {
    title: "Why buy it? Rent it nearby.",
    description: DESCRIPTION,
    type: "website",
    locale: "en_NA",
    siteName: "RentLoop",
  },
};

const MOTTO = "We only earn when you earn.";

// Only what is true today: requests are free, renters never pay RentLoop (SRS 1.3)
// and RentLoop never holds rental money (2.4). No verification promise until M5.
const TRUST = ["Free to request", "Renters never pay RentLoop", "Pay the owner directly"];

const STEPS = [
  { title: "Find it near you", body: "Search by town and dates. See photos, the price and the deposit." },
  { title: "Send a free request", body: "Several people can ask for the same dates. The owner picks one." },
  {
    title: "Collect and pay the owner",
    body: "Once the owner accepts, you both see each other's name and number. Pay the rent and deposit when you collect.",
  },
];

const OWNER_POINTS = [
  "Free listings, no monthly fee on the Free plan",
  "Renters pay you directly, rent and deposit",
  "Hire businesses get staff, quotes and checkout records",
];

// Quiet light green ticks: bright green (highlight) is only for headline words.
const tick = "mt-0.5 h-5 w-5 shrink-0 text-deep-muted";

/** The public homepage: the marketplace front door for renters and owners. proxy.ts sends signed-in users to their calendar instead. */
export default async function HomePage() {
  const supabase = await createClient();
  const [plans, launchEndsOn] = await Promise.all([loadPlans(supabase), loadLaunchEndsOn(supabase)]);
  // Founding prices and the 0% booking fee only while the launch is on.
  const launchOn = launchIsOn(launchEndsOn);

  return (
    <>
      {/* Hero with search (FR-SR-01). /search arrives in M3. */}
      <section className="bg-deep text-deep-foreground">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:pb-16 sm:pt-16">
          <p className="text-sm font-medium text-deep-muted">{MOTTO}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="block">Why buy it?</span>
            <span className="block text-highlight">Rent it nearby.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-deep-muted">
            Tents, tools, cameras and event gear from people and hire businesses near you. Pay the owner directly.
          </p>

          <form
            action="/search"
            method="get"
            role="search"
            aria-label="Search for something to rent"
            className="mt-8 grid gap-3 rounded-2xl bg-card p-3 text-foreground shadow-lg sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-end sm:p-4"
          >
            <SearchField label="What">
              <input name="q" type="search" placeholder="Tent, drill, camera" className={`${inputClass} min-h-12`} />
            </SearchField>
            <SearchField label="Where">
              <select name="town" defaultValue="" className={`${inputClass} min-h-12`}>
                <option value="">Anywhere</option>
                {SEARCH_TOWNS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </SearchField>
            <SearchField label="When">
              <input name="date" type="date" min={namibiaToday()} className={`${inputClass} min-h-12`} />
            </SearchField>
            <button type="submit" className={`${buttonClass} min-h-12 px-6`}>
              Search
            </button>
          </form>

          {/* One row that scrolls sideways on phones, wrapping from sm up. */}
          <div className="-mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <span className="shrink-0 text-sm text-deep-muted">Popular:</span>
            {POPULAR_SEARCHES.map((q) => (
              <Link
                key={q}
                href={searchHref({ q })}
                prefetch={false}
                className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium ${outlineOnDeepClass}`}
              >
                {q}
              </Link>
            ))}
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckIcon className={tick} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories (FR-IN-06) */}
      <Section id="categories" title="Browse by category">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="grid">
              <CategoryTile slug={c.slug} label={c.name} href={searchHref({ category: c.slug })} prefetch={false} />
            </li>
          ))}
        </ul>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" title="How RentLoop works" intro="Renting is free. You deal with the owner directly.">
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

      {/* For owners */}
      <section aria-labelledby="owners-title" className="mx-auto max-w-5xl px-4">
        <div className="grid gap-8 rounded-2xl bg-deep p-6 text-deep-foreground sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 id="owners-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Earn with what you own.
            </h2>
            <p className="mt-3 max-w-md text-deep-muted">
              List your tent, tools or camera in minutes. You set the price and approve every booking. {MOTTO}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className={accentButtonOnDeepClass}>
                List an item free
              </Link>
              <Link href="/login" className={secondaryButtonOnDeepClass}>
                Set up a hire business
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {OWNER_POINTS.map((p) => (
              <li key={p} className="flex gap-2">
                <CheckIcon className={tick} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

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
                    <li className="text-muted-foreground">{bookingFeeText(p, launchOn)}</li>
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
        <div className="grid gap-8 lg:grid-cols-2">
          <FaqGroup title="Renting" items={RENTER_FAQ} />
          <FaqGroup title="Listing" items={OWNER_FAQ} />
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

function SearchField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-sm font-semibold text-foreground-soft">{label}</span>
      {children}
    </label>
  );
}

function FaqGroup({ title, items }: { title: string; items: Faq[] }) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((f) => (
          <details key={f.question} className="group px-5">
            <summary
              className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden ${focusRingClass}`}
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
    </div>
  );
}
