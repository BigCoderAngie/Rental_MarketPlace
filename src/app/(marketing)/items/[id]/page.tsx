import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BookingCard } from "@/components/booking-card";
import { focusRingClass } from "@/components/button";
import { CategoryBar } from "@/components/category-bar";
import { SectionHead } from "@/components/home-sections";
import { HeartIcon } from "@/components/icons";
import { ItemGallery } from "@/components/item-gallery";
import { LockIcon, LockedDetails } from "@/components/locked-details";
import { RequestPanel } from "@/components/request-panel";
import { SampleTag } from "@/components/sample-tag";
import { addDays, daysInclusive, isIsoDate, namibiaToday } from "@/lib/dates";
import { upcomingWeekend } from "@/lib/explore";
import { itemPhotoUrl } from "@/lib/item-photos";
import { categoryLabel } from "@/lib/listings";
import { formatNadWhole } from "@/lib/money";
import { conditionLabel } from "@/lib/requests";
import { ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

type Listing = {
  id: string;
  name: string;
  category: string;
  category_name: string;
  description: string | null;
  condition: string | null;
  daily_price: number;
  deposit: number;
  min_days: number;
  in_service: number;
  photo_path: string | null;
  gallery_paths: string[];
  area: string | null;
  town: string | null;
  owner_kind: "individual" | "business";
  owner_since: number;
  owner_rentals: number;
  free_units: number | null;
  is_mine: boolean;
  similar: { id: string; name: string; category: string; category_name: string; daily_price: number; photo_path: string | null; town: string | null; area: string | null }[];
};

const loadListing = cache(async (id: string, from: string, to: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_listing", { p_item_id: id, p_from: from, p_to: to });
  if (error) throw error;
  return { supabase, listing: data as Listing | null };
});

/** The dates asked for in the address, or this weekend stretched to the item's minimum days. */
function pickDates(params: Record<string, string | string[] | undefined>, today: string) {
  const from = typeof params.from === "string" && isIsoDate(params.from) && params.from >= today ? params.from : null;
  const to = typeof params.to === "string" && isIsoDate(params.to) && from && params.to >= from && daysInclusive(from, params.to) <= 90 ? params.to : null;
  if (from) return { from, to: to ?? from };
  return upcomingWeekend(today);
}

export async function generateMetadata({ params }: PageProps<"/items/[id]">): Promise<Metadata> {
  const { id } = await params;
  const weekend = upcomingWeekend(namibiaToday());
  const loaded = await loadListing(id, weekend.from, weekend.to);
  if (!loaded?.listing) return { title: "Item not found | RentLoop" };
  const l = loaded.listing;
  return { title: `${l.name} to rent in ${l.area ?? l.town ?? "Namibia"} | RentLoop`, description: `${formatNadWhole(Number(l.daily_price))} a day. Free to request, pay the owner at collection.` };
}

// Build kit Part 6: docs/build-kit/reference/desktop/SiteItem.html and mobile/SiteItem.html.
export default async function ItemPage({ params, searchParams }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const today = namibiaToday();
  const query = await searchParams;
  const picked = pickDates(query, today);
  const first = await loadListing(id, picked.from, picked.to);
  if (!first?.listing) notFound();
  // The weekend may be shorter than the item's minimum; stretch it when no dates were chosen.
  const { from } = picked;
  let { to } = picked;
  let loaded = first;
  if (daysInclusive(from, to) < first.listing.min_days && !query.to) {
    to = addDays(from, first.listing.min_days - 1);
    loaded = (await loadListing(id, from, to))!;
  }
  const { supabase, listing: l } = loaded as { supabase: typeof first.supabase; listing: Listing };
  const { data: claims } = await supabase.auth.getClaims();
  const signedIn = Boolean(claims?.claims);

  const photos = [l.photo_path, ...l.gallery_paths].map((p) => itemPhotoUrl(supabase, p)).filter((u): u is string => Boolean(u));
  const place = [l.area, l.town].filter(Boolean).join(", ") || "Namibia";
  const condition = conditionLabel(l.condition);
  const shortCategory = categoryLabel(l.category, l.category_name);

  return (
    <>
      {signedIn && <CategoryBar current={l.category} />}
      <div className="md:wrap pb-32 md:pt-6 lg:pb-16">
        {query.listed === "1" && l.is_mine && (
          <p role="status" className="mx-4 mb-4 rounded-btn border border-primary-border bg-primary-soft px-4 py-3 text-sm font-medium text-primary-ink md:mx-0">
            Your item is live. Renters can find it on Explore and send you requests.
          </p>
        )}
        <Link href={`/explore?cat=${l.category}`} className={`mb-4 hidden rounded text-sm md:inline-block ${focusRingClass}`}>
          <span className="font-semibold text-primary">← {shortCategory}</span> <span className="text-muted-foreground">· {l.name}</span>
        </Link>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-7">
          {/* Top: photos, title and price */}
          <div className="flex flex-col gap-5 lg:col-start-1">
            <div className="relative">
              <ItemGallery photos={photos} name={l.name} />
              <Link href={`/explore?cat=${l.category}`} aria-label="Back to results" className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md md:hidden">
                <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
              <Link
                href={signedIn ? ROUTES.myBookings : `${ROUTES.signIn}?${new URLSearchParams({ next: `/items/${l.id}` })}`}
                aria-label={`Save ${l.name}`}
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md md:top-4 md:right-4"
              >
                <HeartIcon />
              </Link>
            </div>

            <div className="flex flex-col gap-2 px-4 md:px-0">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-[.06em] text-primary-ink uppercase">
                {shortCategory}
                {condition && <span className="rounded-full bg-primary-soft px-2 py-0.5 tracking-normal normal-case">{condition}</span>}
              </span>
              <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] md:text-[40px]">{l.name}</h1>
              <span className="text-sm text-muted-foreground">New on RentLoop · {place}</span>
            </div>

            <div className="mx-4 flex items-start justify-between gap-4 rounded-card border border-primary-border bg-primary-soft px-5 py-4 md:mx-0 md:px-6 md:py-5">
              <span className="flex flex-col">
                <span className="text-[28px] font-extrabold tracking-[-0.02em] whitespace-nowrap md:text-[32px]">
                  {formatNadWhole(Number(l.daily_price))} <small className="text-base font-medium text-foreground-soft">/ day</small>
                </span>
                <span className="text-sm text-foreground-soft">Minimum {l.min_days} day{l.min_days === 1 ? "" : "s"}</span>
              </span>
              <span className="flex flex-col text-right">
                <strong className="text-xl md:text-[22px]">{formatNadWhole(Number(l.deposit))}</strong>
                <span className="text-sm text-foreground-soft">deposit, paid to the owner</span>
              </span>
            </div>
          </div>

          {/* The request panel: a sticky card beside everything on desktop, after the price on phones. */}
          <div className="px-4 md:px-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <RequestPanel
              itemId={l.id}
              dailyPrice={Number(l.daily_price)}
              deposit={Number(l.deposit)}
              minDays={l.min_days}
              inService={l.in_service}
              today={today}
              from={from}
              to={to}
              freeUnits={l.free_units}
              isMine={l.is_mine}
            />
          </div>

          {/* The rest: owner, about, reviews, similar */}
          <div className="flex flex-col gap-6 px-4 md:px-0 lg:col-start-1">
            <section aria-label="The owner" className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 md:p-5">
              <div className="flex items-center gap-3">
                <LockIcon />
                <span className="flex flex-col gap-0.5">
                  <strong className="flex flex-wrap items-center gap-2">
                    {l.owner_kind === "business" ? "Hire business" : "Owner"} <SampleTag>ID check soon</SampleTag>
                  </strong>
                  <span className="text-[13px] text-muted-foreground">
                    On RentLoop since {l.owner_since} · {l.owner_rentals} rental{l.owner_rentals === 1 ? "" : "s"}
                  </span>
                </span>
              </div>
              <LockedDetails />
            </section>

            {l.description && (
              <section aria-labelledby="about-title" className="flex flex-col gap-2">
                <h2 id="about-title" className="text-[21px] font-extrabold md:text-[22px]">
                  About this item
                </h2>
                <p className="max-w-[640px] text-base leading-relaxed whitespace-pre-line text-foreground-soft">{l.description}</p>
              </section>
            )}

            <section aria-labelledby="reviews-title" className="flex flex-col gap-3">
              <h2 id="reviews-title" className="text-[21px] font-extrabold md:text-[22px]">
                Reviews
              </h2>
              <p className="rounded-card border border-border bg-card px-4 py-4 text-sm text-muted-foreground">No reviews yet. Reviews come from completed bookings only.</p>
            </section>

            {l.similar.length > 0 && (
              <section aria-labelledby="similar-title" className="flex flex-col gap-3.5">
                <SectionHead
                  id="similar-title"
                  title="Similar near you"
                  side={
                    <Link href={`/explore?cat=${l.category}`} className={`rounded py-2 text-sm font-semibold text-primary ${focusRingClass}`}>
                      View all →
                    </Link>
                  }
                />
                <div className="no-scrollbar -mr-4 flex gap-3 overflow-x-auto pr-4 md:mr-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pr-0">
                  {l.similar.map((s) => {
                    const href = `/items/${s.id}`;
                    return (
                      <div key={s.id} className="w-[260px] flex-none md:w-auto">
                        <BookingCard
                          item={{
                            title: s.name,
                            category: categoryLabel(s.category, s.category_name),
                            area: s.area ?? s.town ?? "Namibia",
                            price: Number(s.daily_price),
                            unit: "day",
                            availability: "See dates on the item page",
                            availableNow: false,
                            photoUrl: itemPhotoUrl(supabase, s.photo_path),
                          }}
                          href={href}
                          saveHref={href}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
