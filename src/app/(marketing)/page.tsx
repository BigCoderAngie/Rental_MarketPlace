import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BookingCard } from "@/components/booking-card";
import { focusRingClass } from "@/components/button";
import { CategoryTiles } from "@/components/category-tiles";
import { Flag } from "@/components/flag";
import { AppPromo, EarnSection, Faq, HowItWorks, Reviews, SectionHead } from "@/components/home-sections";
import { CheckDot, CheckIcon } from "@/components/icons";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { SampleTag } from "@/components/sample-tag";
import { SearchBar } from "@/components/search-bar";
import { HERO_CARDS, POPULAR_LISTINGS } from "@/lib/home-samples";
import { ROUTES, searchHref } from "@/lib/site-links";

const DESCRIPTION =
  "Rent cameras, tents, tools and party gear from people and hire businesses near you, all over Namibia. Free to request, no fees for renters. We only earn when you earn.";

export const metadata: Metadata = {
  title: "RentLoop | Why buy it? Rent it nearby.",
  description: DESCRIPTION,
  openGraph: {
    title: "Why buy it? Rent it nearby.",
    description: DESCRIPTION,
    type: "website",
    locale: "en_NA",
    siteName: "RentLoop",
  },
};

// The kit's popular searches, with Tent hire in place of Bakkie hire (no vehicles at launch).
const POPULAR_CHIPS = ["Tent hire", "Cameras", "Wedding marquees", "Camping gear", "Power tools"];

// Build kit Part 3: the home page, as docs/build-kit/reference/desktop/SiteHome.html
// and mobile/SiteHome.html, section by section (03-PAGES-AND-ROUTES.md §1).
export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="wrap flex flex-col gap-10 pb-12 md:gap-[72px] md:pb-[72px]">
        <CategoryTiles />
        <PopularNearYou />
        <HowItWorks />
        <EarnSection />
        <Reviews />
        <AppPromo />
        <Faq />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-deep text-deep-foreground">
      <span aria-hidden className="absolute -top-[200px] -right-40 hidden h-[720px] w-[720px] rounded-full bg-deep-2 md:block" />
      <div className="wrap relative flex flex-col gap-12 pt-6 pb-10 md:pt-16 md:pb-[72px] xl:flex-row xl:items-center xl:justify-between">
        <div className="relative z-[2] flex min-w-0 flex-col gap-[18px] md:gap-[22px] xl:flex-[1_1_520px]">
          <span className="flex items-center gap-2 self-start rounded-full border border-white/18 bg-white/10 py-[5px] pr-3 pl-1.5 text-[12.5px] font-bold md:gap-2.5 md:py-[7px] md:pr-4 md:pl-2 md:text-sm">
            <Flag width={26} />
            <span>
              Namibia&apos;s rental marketplace<span className="hidden md:inline"> · <span className="text-accent">We only earn when you earn</span></span>
            </span>
          </span>
          <h1 className="text-[42px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[66px] md:leading-none md:tracking-[-0.035em]">
            Why buy it?
            <br />
            <span className="text-accent">Rent it nearby.</span>
          </h1>
          <p className="max-w-[560px] text-[16.5px] leading-normal text-primary-soft md:text-[19px] md:leading-[1.55]">
            Cameras, tents, tools and party gear from people near you.
            <span className="hidden md:inline"> Pay a fraction of the price, and pay the owner directly.</span>
            <span className="md:hidden"> Pay the owner directly.</span>
          </p>
          <SearchBar />
          <div className="no-scrollbar -mr-4 flex items-center gap-2 overflow-x-auto pr-4 md:mr-0 md:flex-wrap md:overflow-visible md:pr-0">
            <span className="mr-1 hidden text-[13.5px] text-deep-muted md:inline">Popular:</span>
            {POPULAR_CHIPS.map((chip) => (
              <Link
                key={chip}
                href={searchHref(chip)}
                className="flex-none rounded-full border border-white/25 px-3.5 py-2 text-[13.5px] font-semibold text-deep-foreground hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground md:py-[7px]"
              >
                {chip}
              </Link>
            ))}
          </div>
          <ul className="flex flex-col gap-2.5 md:mt-1 md:flex-row md:flex-wrap md:gap-6">
            <Proof>Free to request</Proof>
            <Proof>No fees for renters</Proof>
            {/* ID checks arrive in M5 (MASTER-PLAN decision 11). */}
            <Proof tag="Soon">ID-checked owners</Proof>
          </ul>
        </div>
        <SmallCollage />
        <BigCollage />
      </div>
    </section>
  );
}

function Proof({ children, tag }: { children: ReactNode; tag?: string }) {
  return (
    <li className="flex items-center gap-2 text-sm font-semibold text-primary-soft md:text-[14.5px]">
      <CheckDot />
      {children}
      {tag && <SampleTag onDeep>{tag}</SampleTag>}
    </li>
  );
}

/** A white note floating over the collage: an icon tile, a bold line and a muted line. */
function HeroNote({ icon, title, line, className }: { icon: ReactNode; title: string; line: string; className: string }) {
  return (
    <div className={`absolute flex items-center gap-2.5 rounded-[16px] bg-card px-3.5 py-2.5 text-foreground shadow-[0_16px_34px_rgba(0,0,0,.3)] xl:min-w-[250px] xl:gap-3 xl:rounded-card xl:px-4 xl:py-3 xl:shadow-[0_18px_40px_rgba(0,0,0,.28)] ${className}`}>
      {icon}
      <span className="flex flex-col gap-0.5">
        <strong className="text-[13.5px] xl:text-sm">{title}</strong>
        <span className="text-xs text-muted-foreground xl:text-[12.5px]">{line}</span>
      </span>
    </div>
  );
}

const acceptedIcon = (
  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primary text-primary-foreground xl:h-10 xl:w-10 xl:rounded-btn-sm">
    <CheckIcon size={18} />
  </span>
);

/** A tilted photo card with a white price pill. */
function PhotoCard({ label, price, className, style }: { label: string; price: string; className: string; style: CSSProperties }) {
  return (
    <div className={`absolute overflow-hidden ${className}`} style={style}>
      <ImagePlaceholder alt={label} radius="0" className="h-full" aspect="auto" />
      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-card px-2.5 py-[5px] text-xs font-extrabold text-foreground xl:bottom-3 xl:left-3 xl:px-3 xl:py-1.5 xl:text-[13px]">
        {price}
      </span>
    </div>
  );
}

/** Below 1280px: the phone reference's small collage, two photos and "Request accepted", under the text. */
function SmallCollage() {
  const [camera, second] = HERO_CARDS;
  return (
    <div className="relative mt-2 h-[250px] w-full max-w-[390px] xl:hidden" aria-label="Sample listings" role="group">
      <PhotoCard
        label={camera!.label}
        price={camera!.price}
        className="top-2.5 left-0 h-40 w-[210px] rounded-[20px] shadow-[0_16px_34px_rgba(0,0,0,.35)]"
        style={{ transform: "rotate(-3deg)" }}
      />
      <PhotoCard
        label={second!.label}
        price={second!.price}
        className="top-0 right-0 h-[130px] w-[150px] rounded-[20px] shadow-[0_16px_34px_rgba(0,0,0,.35)]"
        style={{ transform: "rotate(4deg)" }}
      />
      <HeroNote icon={acceptedIcon} title="Request accepted" line="Camera with 2 lenses · 14–16 Nov" className="top-[178px] left-[70px]" />
      <span className="absolute -bottom-1 left-0">
        <SampleTag onDeep />
      </span>
    </div>
  );
}

/**
 * From 1280px: the kit's fixed 540×550 collage beside the text. It never
 * shrinks, and below 1280px the small collage shows instead, so it can never
 * overlap the search.
 */
function BigCollage() {
  return (
    <div className="relative z-[1] hidden h-[550px] w-[540px] flex-none xl:block" aria-label="Sample listings" role="group">
      {HERO_CARDS.map((card) => (
        <PhotoCard
          key={card.label}
          label={card.label}
          price={card.price}
          className="rounded-[24px] shadow-[0_24px_50px_rgba(0,0,0,.35)]"
          style={{ width: card.w, height: card.h, top: card.top, left: card.left, transform: `rotate(${card.rotate}deg)` }}
        />
      ))}
      <HeroNote icon={acceptedIcon} title="Request accepted" line="Camera with 2 lenses · 14–16 Nov" className="top-[215px] left-[200px]" />
      <HeroNote
        icon={
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-btn-sm bg-accent font-extrabold text-accent-foreground">N$</span>
        }
        title="+ N$1,950 this weekend"
        line="An owner in Klein Windhoek earned"
        className="top-[478px] left-[240px]"
      />
      <span className="absolute top-[-28px] right-0">
        <SampleTag onDeep />
      </span>
    </div>
  );
}

/** "Popular near you": four sample cards; two columns from 768px, four from 1024px, a sideways row on phones. */
function PopularNearYou() {
  return (
    <section aria-labelledby="popular-title" className="flex flex-col gap-3.5 md:gap-5">
      <SectionHead
        id="popular-title"
        title="Popular near you"
        note="Top rented in Windhoek this week. Requests are free."
        phoneNote="Requests are free."
        side={
          <span className="flex items-center gap-3">
            <SampleTag />
            <Link href={ROUTES.explore} className={`rounded py-2 text-sm font-semibold whitespace-nowrap text-primary hover:text-primary-strong ${focusRingClass}`}>
              View all →
            </Link>
          </span>
        }
      />
      <div className="no-scrollbar -mr-4 flex gap-3 overflow-x-auto pr-4 pb-2 md:mr-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pr-0 md:pb-0 lg:grid-cols-4">
        {POPULAR_LISTINGS.map((item) => (
          <div key={item.title} className="w-[280px] flex-none md:w-auto">
            <BookingCard item={item} href={ROUTES.explore} saveHref={ROUTES.signIn} />
          </div>
        ))}
      </div>
    </section>
  );
}
