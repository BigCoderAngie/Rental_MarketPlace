import type { Metadata } from "next";
import Link from "next/link";
import { BookingCard } from "@/components/booking-card";
import { Button, buttonClasses, focusRingClass } from "@/components/button";
import { CategoryBar } from "@/components/category-bar";
import { ExploreFiltersForm } from "@/components/explore-filters";
import { FilterSheet } from "@/components/filter-sheet";
import { SearchIcon } from "@/components/icons";
import { SampleTag } from "@/components/sample-tag";
import { SortMenu } from "@/components/sort-menu";
import { namibiaToday } from "@/lib/dates";
import { ANYWHERE, MAX_RESULTS, PAGE_SIZE, SORTS, exploreHref, formatShortRange, parseExploreParams, upcomingWeekend, type ExploreFilters, type Sort } from "@/lib/explore";
import { POPULAR_LISTINGS } from "@/lib/home-samples";
import { marketplaceHasListings, searchListings, type ListingResult } from "@/lib/listings";
import { CATEGORIES, ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Explore rentals near you | RentLoop",
  description: "Cameras, tents, tools and party gear to rent from people and hire businesses near you in Namibia. Free to request.",
};

// Build kit Part 5: docs/build-kit/reference/desktop/SiteExplore.html and mobile/SiteExplore.html.
export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const today = namibiaToday();
  const filters = parseExploreParams(await searchParams, today);
  const supabase = await createClient();
  const [{ data: claims }, results, hasListings] = await Promise.all([
    supabase.auth.getClaims(),
    searchListings(supabase, filters, upcomingWeekend(today)),
    marketplaceHasListings(supabase),
  ]);
  const signedIn = Boolean(claims?.claims);
  const activeFilters = [filters.town !== "Windhoek", filters.from, filters.max].filter(Boolean).length;

  return (
    <>
      {signedIn && <CategoryBar current={filters.cat ?? undefined} />}
      <div className="wrap flex flex-col gap-3.5 pt-3.5 pb-10 md:gap-[22px] md:pt-7 md:pb-16">
        <div className="flex gap-2">
          <SearchForm filters={filters} />
          <div className="md:hidden">
            <FilterSheet active={activeFilters}>
              <ExploreFiltersForm filters={filters} today={today} idPrefix="sheet" />
            </FilterSheet>
          </div>
        </div>

        <CategoryChips filters={filters} />

        <div className="flex flex-col items-start gap-7 lg:flex-row">
          <aside className="hidden w-full max-w-[320px] flex-none rounded-card border border-border bg-card p-6 lg:block">
            <h2 className="mb-[18px] text-xl font-extrabold">Filters</h2>
            <ExploreFiltersForm filters={filters} today={today} idPrefix="side" />
          </aside>

          <section aria-labelledby="results-title" className="flex w-full min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 id="results-title" className="text-sm md:text-[15px]">
                <strong>
                  {results.total} item{results.total === 1 ? "" : "s"}
                </strong>{" "}
                <span className="text-muted-foreground">
                  {filters.town === ANYWHERE ? "in all towns" : `in ${filters.town}`}
                  {filters.from && filters.to && ` · ${formatShortRange(filters.from, filters.to)}`}
                </span>
              </h1>
              <SortMenu value={filters.sort} hrefs={Object.fromEntries((Object.keys(SORTS) as Sort[]).map((s) => [s, exploreHref(filters, { sort: s })])) as Record<Sort, string>} />
            </div>

            {results.items.length > 0 ? (
              <Results items={results.items} filters={filters} signedIn={signedIn} />
            ) : hasListings ? (
              <NoMatches />
            ) : (
              <Samples />
            )}

            {results.total > filters.limit && filters.limit < MAX_RESULTS && (
              <Link href={exploreHref(filters, { limit: filters.limit + PAGE_SIZE })} scroll={false} className={buttonClasses({ variant: "white", size: "lg", className: "mt-3 w-full md:w-auto md:self-center" })}>
                Show more
              </Link>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function SearchForm({ filters }: { filters: ExploreFilters }) {
  return (
    <form action="/explore" role="search" className="flex min-w-0 flex-1">
      {filters.town !== "Windhoek" && <input type="hidden" name="town" value={filters.town} />}
      {filters.from && filters.to && (
        <>
          <input type="hidden" name="from" value={filters.from} />
          <input type="hidden" name="to" value={filters.to} />
        </>
      )}
      {filters.cat && <input type="hidden" name="cat" value={filters.cat} />}
      {filters.max && <input type="hidden" name="max" value={filters.max} />}
      <label className="flex h-[50px] w-full items-center gap-2.5 rounded-input border border-input bg-card px-3.5 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary md:h-16 md:gap-3 md:rounded-card md:pr-2 md:pl-5">
        <SearchIcon />
        <span className="sr-only">What do you need?</span>
        <input type="search" name="q" defaultValue={filters.q} placeholder="What do you need?" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
        <Button type="submit" className="hidden md:inline-flex">
          Search
        </Button>
      </label>
    </form>
  );
}

/** All + the launch categories; picking one keeps the rest of the search. Phones scroll sideways. */
function CategoryChips({ filters }: { filters: ExploreFilters }) {
  const chips = [{ slug: null, label: "All" }, ...CATEGORIES];
  return (
    <nav aria-label="Categories" className="no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4 pb-1 md:mr-0 md:flex-wrap md:gap-2.5 md:pr-0">
      {chips.map((c) => {
        const on = filters.cat === c.slug;
        return (
          <Link
            key={c.label}
            href={exploreHref(filters, { cat: c.slug })}
            aria-current={on ? "page" : undefined}
            className={buttonClasses({ variant: on ? "green" : "white", size: "chip", className: "flex-none" })}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Results({ items, filters, signedIn }: { items: ListingResult[]; filters: ExploreFilters; signedIn: boolean }) {
  const dates = filters.from && filters.to ? `?${new URLSearchParams({ from: filters.from, to: filters.to })}` : "";
  return (
    <div className="grid gap-3.5 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
      {items.map((item) => {
        const href = `/items/${item.id}${dates}`;
        // Visitors sign up first, then come back to the item with their dates (build kit rule 20).
        const requestHref = signedIn ? href : `${ROUTES.join}?${new URLSearchParams({ next: href })}`;
        return <BookingCard key={item.id} item={item} href={href} requestHref={requestHref} saveHref={signedIn ? href : `${ROUTES.signIn}?${new URLSearchParams({ next: href })}`} />;
      })}
    </div>
  );
}

function NoMatches() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card px-6 py-12 text-center">
      <strong className="text-lg">Nothing matches yet</strong>
      <p className="max-w-sm text-sm text-muted-foreground">Try other dates, another town or a higher price, or look in all categories.</p>
      <Link href="/explore" className={`rounded text-sm font-bold text-primary underline ${focusRingClass}`}>
        Clear the search
      </Link>
    </div>
  );
}

/** Before anyone has listed, the kit's cards show what Explore will look like, clearly marked (MASTER-PLAN decision 11). */
function Samples() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-dashed border-input bg-card px-4 py-3 text-sm">
        <SampleTag />
        <span className="text-foreground-soft">No items are listed yet. These sample cards show what you will see once owners list.</span>
        <Link href={ROUTES.ownerSignUp} className={`ml-auto rounded font-bold text-primary underline ${focusRingClass}`}>
          List the first item
        </Link>
      </div>
      <div className="grid gap-3.5 opacity-90 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {POPULAR_LISTINGS.map((item) => (
          <BookingCard key={item.title} item={item} href={ROUTES.explore} requestHref={ROUTES.join} saveHref={ROUTES.signIn} />
        ))}
      </div>
    </>
  );
}
