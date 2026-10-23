import type { Metadata } from "next";
import Link from "next/link";
import { ModeSwitch } from "@/components/account-sidebar";
import { FormMessage } from "@/components/auth-fields";
import { Avatar } from "@/components/avatar";
import { ButtonLink, buttonClasses, focusRingClass } from "@/components/button";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { formatShortRange } from "@/lib/explore";
import { itemPhotoUrl } from "@/lib/item-photos";
import { categoryLabel } from "@/lib/listings";
import { formatNadWhole } from "@/lib/money";
import type { OwnerRequest } from "@/lib/owner-requests";
import { displayName } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";
import { becomeHireBusiness, publishDraft } from "./actions";

export const metadata: Metadata = { title: "Owner dashboard | RentLoop" };

type Summary = { kind: string | null; month_total: number; month_bookings: number; active_listings: number; waiting_requests: number; months: { month: string; total: number }[] };
type Listing = { id: string; name: string; category: string; daily_price: number; area: string | null; photo_path: string | null; is_public: boolean };

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

// Build kit Part 8: docs/build-kit/reference/desktop/SiteOwner.html and mobile/SiteOwner.html.
export default async function OwnerDashboardPage({ searchParams }: PageProps<"/owner">) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: claims }, { data: summaryData }, { data: requestData }, { data: listingData }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.rpc("owner_summary"),
    supabase.rpc("owner_requests"),
    supabase.from("items").select("id, name, category, daily_price, area, photo_path, is_public").eq("archived", false).order("created_at", { ascending: false }).limit(12),
  ]);
  const summary = summaryData as Summary;
  const requests = (requestData ?? []) as OwnerRequest[];
  const listings = (listingData ?? []) as Listing[];
  const fullName = String(claims?.claims?.user_metadata?.full_name ?? displayName(null, claims?.claims?.email));
  const waiting = requests.filter((r) => r.status === "REQUESTED").slice(0, 3);
  const monthFees = requests.filter((r) => r.status === "PAID" && r.paid_at?.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((s, r) => s + Number(r.fee_amount), 0);
  const maxMonth = Math.max(1, ...summary.months.map((m) => Number(m.total)));
  const isBusiness = summary.kind === "business";

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 pb-20 md:gap-6 lg:pb-0">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-[-0.02em] md:text-[40px]">Owner dashboard</h1>
          <p className="mt-1 hidden text-base text-muted-foreground md:block">Your listings, requests and money recorded.</p>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <ButtonLink href="/owner/list" size="lg">
            + List a new item
          </ButtonLink>
          <span className="flex items-center gap-3">
            <Avatar name={fullName} />
            <span className="flex flex-col">
              <strong>{fullName}</strong>
              <span className="text-[13px] text-muted-foreground">{isBusiness ? "Hire business" : "Individual owner"}</span>
            </span>
          </span>
        </div>
      </header>
      <div className="lg:hidden">
        <ModeSwitch owner />
      </div>
      <FormMessage message={typeof params.error === "string" ? params.error : undefined} />
      {params.draft === "1" && (
        <p role="status" className="rounded-btn border border-primary-border bg-primary-soft px-4 py-3 text-sm font-medium text-primary-ink">
          Draft saved. Renters can&apos;t see it until you publish it.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-1 rounded-panel bg-deep px-6 py-6 text-deep-foreground">
          <span className="text-sm text-deep-muted">Recorded this month</span>
          <strong className="text-[38px] leading-tight tracking-[-0.02em] md:text-[48px]">{formatNadWhole(Number(summary.month_total))}</strong>
          <span className="text-sm text-deep-muted">
            Paid to you directly by renters · <span className="text-accent">booking fees paid: {formatNadWhole(monthFees)}</span>
          </span>
        </div>
        <Stat label="Bookings this month" value={summary.month_bookings} line="Accepted and paid" />
        <Stat label="Listings" value={summary.active_listings} line="Free to list" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="money-title" className="rounded-panel border border-border bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="money-title" className="text-lg font-extrabold md:text-xl">
              Money recorded
            </h2>
            <span className="text-[13px] text-muted-foreground">Last 6 months</span>
          </div>
          <ol className="flex h-56 items-end gap-3 border-b border-border" aria-label="Money recorded per month">
            {summary.months.map((m, i) => {
              const last = i === summary.months.length - 1;
              const label = MONTH.format(new Date(`${m.month}-01T00:00:00Z`));
              return (
                <li key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-xs text-muted-foreground">{formatNadWhole(Number(m.total))}</span>
                  <span className={`block w-full max-w-12 rounded-t-[10px] ${last ? "bg-primary" : "bg-primary-border"}`} style={{ height: `${Math.max(2, (Number(m.total) / maxMonth) * 75)}%` }} />
                  <span className="pb-1 text-xs text-foreground-soft">{label}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="req-title" className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 id="req-title" className="flex items-center gap-2 text-lg font-extrabold md:text-xl">
              Booking requests
              {summary.waiting_requests > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-danger-foreground">{summary.waiting_requests} new</span>}
            </h2>
            <Link href="/owner/requests" className={`rounded text-sm font-bold text-primary ${focusRingClass}`}>
              Review →
            </Link>
          </div>
          {waiting.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No requests waiting. New ones show here.</p>
          ) : (
            waiting.map((r) => (
              <Link key={r.id} href={`/owner/requests?${new URLSearchParams({ item: r.item_id, r: r.id })}`} className={`flex items-center gap-3 rounded-card border border-border p-3 hover:border-primary-border ${focusRingClass}`}>
                <Thumb url={itemPhotoUrl(supabase, r.photo_path)} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="text-[15px]">
                    {r.label} · {formatShortRange(r.start_date, r.end_date)}
                  </strong>
                  <span className="truncate text-[13px] text-muted-foreground">{r.item_name}</span>
                </span>
                <strong>{formatNadWhole(Number(r.total))}</strong>
              </Link>
            ))
          )}
          <p className="text-xs text-muted-foreground">Names and numbers stay hidden until you accept and pay the booking fee.</p>
        </section>
      </div>

      <section aria-labelledby="listings-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="listings-title" className="text-[21px] font-extrabold md:text-[22px]">
            My listings
          </h2>
          <Link href="/owner/list" className={`rounded text-sm font-bold text-primary ${focusRingClass}`}>
            + Add another
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const photo = itemPhotoUrl(supabase, l.photo_path);
            const body = (
              <>
                <div className="relative">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage
                    <img src={photo} alt="" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <ImagePlaceholder alt="" radius="0" />
                  )}
                  <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${l.is_public ? "bg-deep text-deep-foreground" : "bg-muted text-foreground-soft"}`}>{l.is_public ? "Public" : "Draft"}</span>
                </div>
                <div className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="text-[11px] font-bold tracking-[.06em] text-primary-ink uppercase">{categoryLabel(l.category, l.category)}</span>
                  <strong className="text-[15px]">{l.name}</strong>
                  {l.area && <span className="text-[13px] text-muted-foreground">{l.area}</span>}
                  <span className="text-sm">
                    <strong>{formatNadWhole(Number(l.daily_price))}</strong> / day
                  </span>
                </div>
              </>
            );
            return l.is_public ? (
              <Link key={l.id} href={`/items/${l.id}`} className={`overflow-hidden rounded-card border border-border bg-card ${focusRingClass}`}>
                {body}
              </Link>
            ) : (
              <div key={l.id} className="overflow-hidden rounded-card border border-dashed border-input bg-card">
                {body}
                <form action={publishDraft} className="flex flex-wrap items-center gap-3 px-4 pb-4">
                  <input type="hidden" name="id" value={l.id} />
                  <button className={buttonClasses({ size: "sm" })}>Publish</button>
                  <Link href={`/inventory/${l.id}`} className={`rounded text-sm font-semibold text-primary underline ${focusRingClass}`}>
                    Edit details
                  </Link>
                </form>
              </div>
            );
          })}
          {listings.length === 0 && (
            <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-card p-6">
              <strong className="text-lg">List your first item</strong>
              <p className="text-sm text-muted-foreground">It&apos;s free. You set the price and approve every booking.</p>
              <ButtonLink href="/owner/list" variant="yellow">
                List an item free →
              </ButtonLink>
            </div>
          )}
          {!isBusiness && (
            <div className="flex flex-col justify-center gap-3 rounded-card border-2 border-dashed border-primary-border p-6">
              <strong className="text-lg">Run a hire business?</strong>
              <p className="text-sm leading-normal text-muted-foreground">Add your business name and logo, invite staff, send WhatsApp quotes and keep checkout records.</p>
              <form action={becomeHireBusiness}>
                <button className={`rounded text-sm font-bold text-primary ${focusRingClass}`}>Set up a business account →</button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Phones: the main action sticks to the bottom. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] md:hidden">
        <ButtonLink href="/owner/list" size="lg" className="w-full">
          + List a new item
        </ButtonLink>
      </div>
    </div>
  );
}

function Stat({ label, value, line }: { label: string; value: number; line: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-panel border border-border bg-card px-5 py-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <strong className="text-[32px] leading-tight">{value}</strong>
      <span className="text-[13px] text-muted-foreground">{line}</span>
    </div>
  );
}

function Thumb({ url }: { url: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage
    <img src={url} alt="" className="h-14 w-14 flex-none rounded-btn-sm object-cover" />
  ) : (
    <span className="w-14 flex-none">
      <ImagePlaceholder alt="" radius="12px" aspect="1 / 1" />
    </span>
  );
}
