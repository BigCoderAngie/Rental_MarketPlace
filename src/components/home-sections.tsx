import type { ReactNode } from "react";
import { ButtonLink } from "@/components/button";
import { Flag } from "@/components/flag";
import { ArrowRightIcon, CheckDot, DotIcon, FiveStars } from "@/components/icons";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { LogoMark } from "@/components/logo";
import { SampleTag } from "@/components/sample-tag";
import { StoreButtons } from "@/components/store-buttons";
import { LIVE_CARDS, REVIEW_PLACEHOLDERS, SAMPLE_EARNINGS } from "@/lib/home-samples";
import { ROUTES } from "@/lib/site-links";

// The home page sections below the hero, top to bottom as in
// docs/build-kit/reference/desktop/SiteHome.html and mobile/SiteHome.html.

/** A section heading with its one-line note and an optional link or tag on the right (kit `.sec`). `phoneNote` is the kit's shorter note for phones. */
export function SectionHead({ id, title, note, phoneNote, side }: { id?: string; title: string; note?: string; phoneNote?: string; side?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-[21px] font-extrabold tracking-[-0.01em] md:text-[22px]">
          {title}
        </h2>
        {note && (
          <p className="mt-1 text-[13px] text-muted-foreground">
            {phoneNote ? (
              <>
                <span className="md:hidden">{phoneNote}</span>
                <span className="hidden md:inline">{note}</span>
              </>
            ) : (
              note
            )}
          </p>
        )}
      </div>
      {side}
    </div>
  );
}

/** A tick in a green circle and a line of text (kit `.chk`). */
export function Check({ children, className = "text-sm" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <CheckDot />
      {children}
    </span>
  );
}

const STEPS = [
  { title: "Find it near you", desktop: "Search by town and dates. See photos, price, deposit and reviews.", phone: "Search by town and dates. See photos, price and reviews." },
  { title: "Send a free request", desktop: "Several people can ask. The owner picks one and accepts.", phone: "Several people can ask. The owner picks one." },
  { title: "Collect and pay the owner", desktop: "You both get each other's details. Pay rent and deposit when you collect.", phone: "You both get each other's details. Pay rent and deposit when you collect." },
];

/** Three white step cards with yellow numbers. Phones: compact rows with the number on the left. */
export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="flex scroll-mt-24 flex-col gap-3 md:gap-5">
      <SectionHead
        id="how-title"
        title="How RentLoop works"
        note="Renting is free. Owners pay a small fee only when they accept a renter."
        phoneNote="Renting is free. Owners pay a small fee only when they accept."
      />
      <ol className="flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-5">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-3.5 rounded-card border border-border bg-card p-4 md:flex-[1_1_260px] md:flex-col md:gap-2.5 md:rounded-panel md:p-[26px]"
          >
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-accent font-extrabold text-accent-foreground md:h-11 md:w-11 md:text-lg">
              {i + 1}
            </span>
            <span className="flex flex-col gap-[3px] md:gap-2.5">
              <strong className="text-base md:text-[19px]">{step.title}</strong>
              <span className="text-sm leading-[1.45] text-muted-foreground md:hidden">{step.phone}</span>
              <span className="hidden text-[15px] leading-normal text-muted-foreground md:block">{step.desktop}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The kit's earnings card: a total, two lines of detail and a little bar chart. Sample until owners have real bookings. */
function EarningsCard() {
  const { total, listings, bookings, bars } = SAMPLE_EARNINGS;
  return (
    <div className="flex items-end justify-between rounded-card bg-deep px-[18px] py-4 md:rounded-panel md:px-6 md:py-[22px] md:shadow-[0_16px_40px_rgba(0,0,0,.25)]">
      <span className="flex flex-col gap-0.5 md:gap-1">
        <span className="flex items-center gap-2 text-[12.5px] text-deep-muted md:text-[13px]">
          Recorded this month <SampleTag onDeep />
        </span>
        <strong className="text-[30px] tracking-[-0.02em] md:text-[38px]">{total}</strong>
        <span className="text-[12.5px] text-on-deep-2 md:text-[13px]">
          {listings} active listings<span className="hidden md:inline"> · {bookings} bookings</span>
        </span>
      </span>
      <span aria-hidden className="flex h-14 items-end gap-[5px] md:h-[70px] md:gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`block w-3.5 rounded-t ${i === bars.length - 1 ? "bg-accent" : "bg-deep-bar"}`}
            style={{ height: `${(h / 70) * 100}%` }}
          />
        ))}
      </span>
    </div>
  );
}

/**
 * The green Earn section: "N$0 to list, always", the motto, three ticks and
 * two buttons; on the right the earnings card and two LIVE listing cards
 * (samples). Phones: everything stacks and the LIVE cards are left out.
 */
export function EarnSection() {
  return (
    <section
      aria-labelledby="earn-title"
      className="flex flex-col gap-3.5 rounded-[26px] bg-primary px-5 py-[26px] text-primary-foreground md:flex-row md:flex-wrap md:items-center md:gap-10 md:rounded-section md:px-14 md:py-[52px]"
    >
      <div className="flex flex-col gap-3.5 md:flex-[1_1_440px] md:gap-4">
        <span className="self-start rounded-full bg-accent px-3 py-[5px] text-[12.5px] font-extrabold text-accent-foreground md:px-3.5 md:py-1.5 md:text-[13px]">
          N$0 to list, always
        </span>
        <h2 id="earn-title" className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em] md:text-[42px] md:leading-[1.08]">
          Earn with what you own.
          <br />
          <span className="text-accent">We only earn when you earn.</span>
        </h2>
        <p className="max-w-[520px] text-[15.5px] leading-[1.55] text-primary-soft md:text-[17px]">
          List your camera, tools or party tent in minutes. You set the price and approve every booking.
          <span className="hidden md:inline"> You only pay a small booking fee when you accept a renter.</span>
        </p>
        <div className="flex flex-col gap-2.5">
          <Check>Free listings, no monthly fee on the Free plan</Check>
          <Check>Renters pay you directly, rent and deposit</Check>
          <Check>Hire businesses: staff, quotes and checkout records</Check>
        </div>
        <div className="mt-1 md:hidden">
          <EarningsCard />
        </div>
        <div className="flex flex-col gap-3 md:mt-1.5 md:flex-row md:flex-wrap">
          <ButtonLink href={ROUTES.ownerSignUp} variant="yellow" size="lg" className="w-full md:w-auto">
            List an item free
            <ArrowRightIcon />
          </ButtonLink>
          <ButtonLink href={ROUTES.ownerSignUp} variant="outline" size="lg" className="w-full md:w-auto">
            Set up a hire business
          </ButtonLink>
        </div>
      </div>

      <div className="relative hidden min-h-[360px] md:block md:flex-[1_1_420px]">
        <div className="absolute top-0 right-10 left-0">
          <EarningsCard />
        </div>
        <div className="absolute bottom-0 left-[30px] flex gap-4">
          {LIVE_CARDS.map((card) => (
            <div key={card.title} className="w-[170px] flex-none overflow-hidden rounded-[16px] bg-card text-foreground shadow-[0_10px_24px_rgba(0,0,0,.18)]">
              <div className="relative">
                <ImagePlaceholder alt="" radius="0" aspect="170 / 110" />
                <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-[3px] text-[10.5px] font-extrabold flex items-center gap-1 text-primary-foreground">
                  <DotIcon />
                  LIVE
                </span>
                <span className="absolute top-2 right-2">
                  <SampleTag />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 px-3 py-2.5">
                <strong className="text-[13.5px]">{card.title}</strong>
                <span className="text-[13px]">
                  <strong>{card.price}</strong> / day
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Three review cards. Placeholders until real reviews from completed bookings exist; phones scroll sideways. */
export function Reviews() {
  return (
    <section aria-labelledby="reviews-title" className="flex flex-col gap-3.5 md:gap-5">
      <SectionHead id="reviews-title" title="What people say" side={<SampleTag>Placeholder</SampleTag>} />
      <div className="no-scrollbar -mr-4 flex gap-3 overflow-x-auto pr-4 md:mr-0 md:flex-wrap md:gap-5 md:overflow-visible md:pr-0">
        {REVIEW_PLACEHOLDERS.map((r) => (
          <figure
            key={r.initial}
            className="flex w-[290px] flex-none flex-col gap-3.5 rounded-panel border border-border bg-card p-6 md:w-auto md:flex-[1_1_280px]"
          >
            <span>
              <FiveStars size={18} />
              <span className="sr-only">5 out of 5 stars</span>
            </span>
            <blockquote className="text-base leading-[1.55] text-foreground-soft">{r.quote}</blockquote>
            <figcaption className="flex items-center gap-2.5">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-ink">
                {r.initial}
              </span>
              <span className="flex flex-col">
                <strong>[Name]</strong>
                <span className="text-[13px] text-muted-foreground">{r.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** The phone mockup in the app section: a small picture of the app's home screen. */
function PhoneMockup() {
  return (
    <div aria-hidden className="h-[451px] w-[220px] flex-none rounded-[40px] bg-store p-2.5 shadow-[0_30px_60px_rgba(0,0,0,.35)] md:h-[512px] md:w-[250px]">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[31px] bg-background">
        <div className="flex flex-col gap-2 bg-deep px-3.5 pt-[22px] pb-3.5 text-deep-foreground">
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <LogoMark size={18} />
            RentLoop
          </span>
          <strong className="text-[17px] leading-[1.15]">
            What are you renting <span className="text-accent">this weekend?</span>
          </strong>
          <span className="block h-[30px] rounded-[9px] bg-card" />
        </div>
        <div className="flex flex-col gap-2 px-3 py-2.5">
          <span className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="block h-[34px] w-[34px] rounded-[10px] border border-border bg-card" />
            ))}
          </span>
          <strong className="text-xs text-foreground">Hot near you</strong>
          <span className="flex gap-2">
            <ImagePlaceholder alt="" radius="14px" aspect="1 / 1" className="!w-[120px]" />
            <ImagePlaceholder alt="" radius="14px" aspect="80 / 120" className="!w-20" />
          </span>
          <span className="rounded-btn-sm bg-primary px-2.5 py-[9px] text-[10.5px] font-bold text-primary-foreground">
            Earn with what you own · <span className="text-accent">We only earn when you earn</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** The deep green app section: flag pill, heading, three ticks, store buttons, QR placeholder and the phone mockup. */
export function AppPromo() {
  return (
    <section
      id="app"
      aria-labelledby="app-title"
      className="relative flex scroll-mt-24 flex-col gap-3.5 overflow-hidden rounded-[26px] bg-deep px-5 pt-7 text-deep-foreground md:flex-row md:flex-wrap md:items-end md:gap-12 md:rounded-section md:px-16 md:pt-14"
    >
      <span aria-hidden className="absolute -top-[120px] -right-[120px] hidden h-[520px] w-[520px] rounded-full bg-deep-2 md:block" />
      <div className="relative flex flex-col gap-3.5 md:flex-[1_1_420px] md:gap-[18px] md:pb-14">
        <span className="flex items-center gap-2 self-start rounded-full bg-white/10 py-[5px] pr-3 pl-1.5 text-[12.5px] font-bold md:py-1.5 md:pl-2 md:text-[13px]">
          <Flag width={22} />
          Made in Namibia, for Namibia
        </span>
        <h2 id="app-title" className="text-[30px] leading-[1.1] font-extrabold md:text-[42px] md:leading-[1.08] md:tracking-[-0.02em]">
          Rent and earn faster <br className="hidden md:block" />
          <span className="text-accent">
            with the <span className="hidden md:inline">RentLoop </span>app.
          </span>
        </h2>
        <div className="flex flex-col gap-2.5">
          <Check>Get a ping the moment an owner picks you</Check>
          <Check>Call or WhatsApp once a booking is confirmed</Check>
          <Check>List an item with your phone camera in 2 minutes</Check>
        </div>
        <div className="mt-1.5 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start">
          <div className="md:hidden">
            <StoreButtons onDeep light stacked />
          </div>
          <div className="hidden md:block">
            <StoreButtons onDeep light />
          </div>
          <span className="ml-2 hidden items-center gap-2.5 md:flex">
            <span className="flex h-16 w-16 items-center justify-center rounded-btn-sm bg-card text-center text-[10px] font-bold text-deep">[QR CODE]</span>
            <span className="max-w-[120px] text-[13px] text-deep-muted">Scan with your phone camera</span>
          </span>
        </div>
      </div>
      {/* The phone runs off the bottom of the section, as in the kit. */}
      <div className="relative mt-2 -mb-[150px] flex justify-center md:mt-0 md:-mb-[60px]">
        <PhoneMockup />
      </div>
      <div className="h-5 md:hidden" />
    </section>
  );
}

const FAQS = [
  { q: "Do I pay anything to rent?", a: "No. Sending a request is free and renters never pay RentLoop. You pay the rent and deposit to the owner when you collect." },
  { q: "Why can't I see the owner's name or number?", a: "To keep everyone safe. Names, numbers and addresses unlock for both of you once the owner accepts your request." },
  { q: "What if several people want the same item?", a: "The owner sees every request and picks one. The others are told the dates are taken, and their details are never shown." },
  { q: "How does RentLoop make money?", a: "Owners pay a small booking fee only when they accept a renter. We only earn when you earn." },
  { q: "What happens with the deposit?", a: "You pay it to the owner at collection and get it back when you return the item as you got it." },
  { q: "Can my hire business use RentLoop?", a: "Yes. Add your business name and logo, invite staff, send WhatsApp quotes and keep checkout records." },
];

/** "Got questions?": six answers in cards, two columns from 768px, the first two open on desktop. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mt-[30px] flex scroll-mt-24 flex-col gap-3.5 md:mt-10 md:gap-5">
      <SectionHead id="faq-title" title="Got questions?" note="Short answers about renting, listing and the booking fee." />
      <div className="grid gap-2.5 md:grid-cols-2 md:gap-3.5">
        {FAQS.map((item, i) => (
          <details key={item.q} open={i < 2} className="group rounded-card border border-border bg-card px-[22px] py-[18px]">
            <summary className="cursor-pointer text-base font-bold marker:text-muted-foreground">{item.q}</summary>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-foreground-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
