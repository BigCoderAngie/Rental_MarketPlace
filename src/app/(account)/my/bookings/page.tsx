import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitch } from "@/components/account-sidebar";
import { FormMessage, LineIcon } from "@/components/auth-fields";
import { Avatar } from "@/components/avatar";
import { ButtonLink, buttonClasses, focusRingClass } from "@/components/button";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { LockedDetails } from "@/components/locked-details";
import { namibiaToday } from "@/lib/dates";
import { formatShortRange } from "@/lib/explore";
import { itemPhotoUrl } from "@/lib/item-photos";
import { formatNadWhole } from "@/lib/money";
import { TABS, groupByTab, recentActivity, type MyRequest, type Tab } from "@/lib/my-bookings";
import { STATUS_LABEL, expiresIn } from "@/lib/requests";
import { displayName } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";
import { whatsAppLink } from "@/lib/whatsapp";
import { cancelRequest } from "./actions";

export const metadata: Metadata = { title: "My bookings | RentLoop" };

const TAB_LABEL: Record<Tab, string> = { upcoming: "Upcoming", active: "Active", past: "Past" };

// Build kit Part 7: docs/build-kit/reference/desktop/SiteBookings.html and mobile/SiteBookings.html.
export default async function MyBookingsPage({ searchParams }: PageProps<"/my/bookings">) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: claims }, { data, error }] = await Promise.all([supabase.auth.getClaims(), supabase.rpc("my_requests")]);
  if (error) throw error;
  const requests = (data ?? []) as MyRequest[];
  const today = namibiaToday();
  const groups = groupByTab(requests, today);
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : groups.upcoming.length || !groups.active.length ? "upcoming" : "active";
  const name = displayName(claims?.claims?.user_metadata?.full_name, claims?.claims?.email);
  const fullName = String(claims?.claims?.user_metadata?.full_name ?? name);
  const waiting = groups.upcoming.filter((r) => r.status === "REQUESTED").length;
  const activity = recentActivity(requests);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 md:gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-[-0.02em] md:text-[40px]">My bookings</h1>
          <p className="mt-1 hidden text-base text-muted-foreground md:block">Your requests, rentals and history.</p>
        </div>
        <span className="hidden items-center gap-3 md:flex">
          <Avatar name={fullName} />
          <span className="flex flex-col">
            <strong>{fullName}</strong>
            <span className="text-[13px] text-muted-foreground">Renter</span>
          </span>
        </span>
      </header>
      <div className="lg:hidden">
        <ModeSwitch owner={false} />
      </div>

      {params.sent === "1" && <Notice>Request sent. The owner has 24 hours to answer. Their name and number show here if they pick you.</Notice>}
      {params.cancelled === "1" && <Notice>Request cancelled.</Notice>}
      <FormMessage message={typeof params.error === "string" ? params.error : undefined} />

      <div className="no-scrollbar -mr-4 flex gap-3 overflow-x-auto pr-4 md:mr-0 md:grid md:grid-cols-3 md:gap-4 md:pr-0">
        <Stat label="Active" value={groups.active.length} line="Out with you now" />
        <Stat label="Upcoming" value={groups.upcoming.length} line={waiting ? `${waiting} waiting for the owner` : "Accepted and coming up"} />
        <Stat label="Past" value={groups.past.length} line="Finished, declined or expired" />
      </div>

      <nav aria-label="Bookings" className="flex gap-6 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/my/bookings?tab=${t}`}
            aria-current={t === tab ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2.5 text-[15px] md:text-base ${t === tab ? "border-primary font-bold text-primary" : "border-transparent text-foreground-soft hover:text-primary"} ${focusRingClass}`}
          >
            {TAB_LABEL[t]} ({groups[t].length})
          </Link>
        ))}
      </nav>

      {groups[tab].length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card px-6 py-10 text-center">
          <strong>Nothing here yet</strong>
          <p className="text-sm text-muted-foreground">Find something to rent and send a free request.</p>
          <ButtonLink href="/explore">Browse items</ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups[tab].map((r) => (
            <BookingRow key={r.id} r={r} photo={itemPhotoUrl(supabase, r.photo_path)} />
          ))}
        </div>
      )}

      {activity.length > 0 && (
        <section aria-labelledby="activity-title" className="rounded-card border border-border bg-card p-4 md:p-6">
          <h2 id="activity-title" className="mb-3 text-base font-extrabold md:text-xl">
            Recent activity
          </h2>
          <ul className="flex flex-col gap-3">
            {activity.map((a, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-x-4 text-sm md:text-[15px]">
                <span>{a.text}</span>
                <span className="text-muted-foreground">{new Date(a.at).toLocaleString("en-GB", { timeZone: "Africa/Windhoek", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-btn border border-primary-border bg-primary-soft px-4 py-3 text-sm font-medium text-primary-ink">{children}</p>;
}

function Stat({ label, value, line }: { label: string; value: number; line: string }) {
  return (
    <div className="flex w-[150px] flex-none flex-col gap-0.5 rounded-card border border-border bg-card px-4 py-4 md:w-auto md:px-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <strong className="text-[28px] leading-tight md:text-[32px]">{value}</strong>
      <span className="text-[13px] text-muted-foreground">{line}</span>
    </div>
  );
}

const STATUS_TONE: Record<MyRequest["status"], string> = {
  PAID: "bg-primary-soft text-primary-ink",
  REQUESTED: "bg-info-soft text-info-ink",
  DECLINED: "bg-danger-soft text-danger-ink",
  EXPIRED: "bg-muted text-foreground-soft",
  CANCELLED: "bg-muted text-foreground-soft",
};

function BookingRow({ r, photo }: { r: MyRequest; photo: string | null }) {
  const dates = formatShortRange(r.start_date, r.end_date);
  const firstName = r.owner?.name.split(" ")[0] ?? "the owner";
  const label = r.status === "DECLINED" && r.decline_reason === "dates_taken" ? "Dates taken" : STATUS_LABEL[r.status];

  return (
    <article className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 md:flex-row md:items-center md:gap-5 md:p-5">
      <div className="flex gap-4 md:flex-1">
        <Link href={`/items/${r.item_id}`} className="w-[70px] flex-none md:w-[130px]" tabIndex={-1} aria-hidden>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage
            <img src={photo} alt="" className="aspect-square w-full rounded-btn object-cover md:aspect-[4/3]" />
          ) : (
            <ImagePlaceholder alt="" radius="14px" aspect="1 / 1" />
          )}
        </Link>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/items/${r.item_id}`} className={`rounded text-[15px] font-bold md:text-lg ${focusRingClass}`}>
              {r.item_name}
            </Link>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_TONE[r.status]}`}>{label}</span>
          </div>
          <span className="text-[13.5px] text-muted-foreground">
            {dates}
            {r.quantity > 1 && ` · ${r.quantity} units`} · {formatNadWhole(Number(r.total))}
          </span>
          {r.status === "PAID" && r.owner && (
            <span className="text-sm">
              Collect from {r.address ?? r.town}. Pay {r.owner.name} at collection:{" "}
              <strong>
                {formatNadWhole(Number(r.total))} + {formatNadWhole(Number(r.deposit))} deposit
              </strong>
            </span>
          )}
          {r.status === "REQUESTED" && (
            <span className="hidden items-center gap-1.5 text-sm md:flex">
              <LineIcon size={16}>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </LineIcon>
              Owner name, phone and address show if the owner picks you. {expiresIn(r.expires_at)}.
            </span>
          )}
          {r.status === "DECLINED" && (
            <span className="text-sm text-muted-foreground">{r.decline_reason === "dates_taken" ? "The owner picked another renter for these dates. Your details were never shown." : "The owner can't take this one."}</span>
          )}
          {r.status === "EXPIRED" && <span className="text-sm text-muted-foreground">The owner didn&apos;t answer within 24 hours.</span>}
        </div>
      </div>

      {r.status === "REQUESTED" && (
        <div className="md:hidden">
          <LockedDetails rows={["Owner", "Phone"]} note={`Shows if the owner picks you. ${expiresIn(r.expires_at)}.`} />
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 md:flex-none">
        {r.status === "PAID" && r.owner?.phone && (
          <>
            <a href={`tel:${r.owner.phone}`} className={buttonClasses({ variant: "white", className: "flex-1 md:flex-none" })}>
              Call<span className="hidden md:inline"> {firstName}</span>
            </a>
            <a href={whatsAppLink(`Hi ${firstName}, it's about the ${r.item_name} I booked on RentLoop for ${dates}.`, r.owner.phone)} className={buttonClasses({ variant: "white", className: "flex-1 md:flex-none" })}>
              WhatsApp
            </a>
          </>
        )}
        {r.status === "PAID" && (
          <ButtonLink href={`/items/${r.item_id}`} variant="mint" className="flex-1 md:flex-none">
            View<span className="hidden md:inline"> item</span>
          </ButtonLink>
        )}
        {r.status === "REQUESTED" && (
          <form action={cancelRequest} className="w-full md:w-auto">
            <input type="hidden" name="id" value={r.id} />
            <button className={buttonClasses({ variant: "white", className: "w-full md:w-auto" })}>Cancel request</button>
          </form>
        )}
        {(r.status === "DECLINED" || r.status === "EXPIRED" || r.status === "CANCELLED") && (
          <ButtonLink href={`/explore?cat=${r.category}`} variant="white" className="w-full md:w-auto">
            Find another
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
