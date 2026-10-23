import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FormMessage, LineIcon } from "@/components/auth-fields";
import { ButtonLink, buttonClasses, focusRingClass } from "@/components/button";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { LockIcon, LockedDetails } from "@/components/locked-details";
import { Logo } from "@/components/logo";
import { SampleTag } from "@/components/sample-tag";
import { namibiaToday } from "@/lib/dates";
import { formatShortRange } from "@/lib/explore";
import { itemPhotoUrl } from "@/lib/item-photos";
import { formatNadWhole } from "@/lib/money";
import { canClaimRefund, fits, groupByDates, itemsWithRequests, wouldDecline, type OwnerRequest } from "@/lib/owner-requests";
import { STATUS_LABEL, expiresIn, ownerMoney } from "@/lib/requests";
import { createClient } from "@/lib/supabase/server";
import { whatsAppLink } from "@/lib/whatsapp";
import { acceptAndPay, claimRefund, declineRequest } from "./actions";

export const metadata: Metadata = { title: "Booking requests | RentLoop" };

// Build kit Part 8: docs/build-kit/reference/desktop/SiteRequests.html and mobile/SiteRequests.html.
export default async function OwnerRequestsPage({ searchParams }: PageProps<"/owner/requests">) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_requests");
  if (error) throw error;
  const all = (data ?? []) as OwnerRequest[];
  const items = itemsWithRequests(all);
  const itemId = typeof params.item === "string" && items.some((i) => i.id === params.item) ? params.item : items[0]?.id;
  const item = items.find((i) => i.id === itemId);
  const forItem = all.filter((r) => r.item_id === itemId);
  const groups = groupByDates(forItem);
  const history = forItem.filter((r) => r.status !== "REQUESTED");
  const selected = forItem.find((r) => r.id === params.r) ?? groups[0]?.requests[0] ?? history[0];
  const waitingTotal = all.filter((r) => r.status === "REQUESTED").length;
  const today = namibiaToday();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="wrap flex min-h-[64px] flex-wrap items-center gap-x-6 gap-y-1 py-2 md:min-h-[72px]">
          <Link href="/" aria-label="RentLoop home" className={`hidden rounded md:block ${focusRingClass}`}>
            <Logo className="text-[23px] [--mark:38px]" />
          </Link>
          <Link href="/owner" className={`rounded text-sm font-semibold text-primary ${focusRingClass}`}>
            ‹ Owner dashboard
          </Link>
          <h1 className="text-2xl font-extrabold md:text-[28px]">Requests</h1>
          {waitingTotal > 0 && <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-danger-foreground">{waitingTotal} new</span>}
        </div>
      </header>

      <main className="wrap flex flex-col gap-5 pt-5 pb-36 md:pt-7 lg:pb-14">
        <FormMessage message={typeof params.error === "string" ? params.error : undefined} />
        {params.paid === "1" && <Note>Paid in test mode. The renter is unlocked: call or WhatsApp them to arrange collection.</Note>}
        {params.declined === "1" && <Note>Request declined. The renter is told; your details were never shown.</Note>}
        {params.refund === "1" && <Note>Refund claim sent. RentLoop checks it and refunds the booking fee.</Note>}

        {items.length > 1 && (
          <nav aria-label="Items" className="no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4">
            {items.map((i) => (
              <Link key={i.id} href={`/owner/requests?item=${i.id}`} aria-current={i.id === itemId ? "page" : undefined} className={buttonClasses({ variant: i.id === itemId ? "green" : "white", size: "chip", className: "flex-none" })}>
                {i.name}
                {i.waiting > 0 && ` · ${i.waiting}`}
              </Link>
            ))}
          </nav>
        )}

        {!item ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card px-6 py-12 text-center">
            <strong className="text-lg">No requests yet</strong>
            <p className="max-w-sm text-sm text-muted-foreground">When renters ask for your items, they show here as Renter A, B and C.</p>
            <ButtonLink href="/owner/list" variant="yellow">
              List an item
            </ButtonLink>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Left: the item and its requests grouped by dates */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-card border border-border bg-card p-4">
                <Thumb url={itemPhotoUrl(supabase, item.photo_path)} />
                <span className="flex flex-col">
                  <strong className="text-lg">{item.name}</strong>
                  <span className="text-sm text-muted-foreground">
                    You own {item.in_service} · {item.waiting} renter{item.waiting === 1 ? "" : "s"} waiting
                  </span>
                </span>
              </div>

              {groups.some((g) => g.clash) && (
                <p className="rounded-card border border-accent-border bg-accent-soft px-4 py-3.5 text-[15px] leading-normal text-accent-ink">
                  {groups.filter((g) => g.clash).map((g) => (
                    <span key={g.from}>
                      {g.requests.length} requests want <strong>{formatShortRange(g.from, g.to)}</strong>.{" "}
                    </span>
                  ))}
                  Pick one. The others are declined for you, and their details are never shown.
                </p>
              )}

              {groups.map((g) => (
                <section key={g.from} className="flex flex-col gap-3">
                  <h2 className="text-xs font-bold tracking-[.06em] text-muted-foreground uppercase">
                    {g.clash ? "Same dates" : "No clash"} · {formatShortRange(g.from, g.to)}
                  </h2>
                  {g.requests.map((r) => (
                    <RequestCard key={r.id} r={r} selected={r.id === selected?.id} best={r.id === g.bestMatchId} note={!g.clash && groups.length > 1 ? "You can accept this one as well" : undefined} />
                  ))}
                </section>
              ))}
              {groups.length > 0 && <p className="text-sm text-muted-foreground">Unanswered requests expire after 24 hours.</p>}

              {history.length > 0 && (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xs font-bold tracking-[.06em] text-muted-foreground uppercase">Answered</h2>
                  {history.map((r) => (
                    <RequestCard key={r.id} r={r} selected={r.id === selected?.id} />
                  ))}
                </section>
              )}
            </div>

            {/* Right: the selected request */}
            {selected && <RequestDetail r={selected} declines={wouldDecline(selected, groups)} today={today} />}
          </div>
        )}
      </main>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-btn border border-primary-border bg-primary-soft px-4 py-3 text-sm font-medium text-primary-ink">{children}</p>;
}

function Thumb({ url }: { url: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage
    <img src={url} alt="" className="h-16 w-16 flex-none rounded-btn object-cover" />
  ) : (
    <span className="w-16 flex-none">
      <ImagePlaceholder alt="" radius="14px" aspect="1 / 1" />
    </span>
  );
}

function rentalsLine(r: OwnerRequest) {
  return r.renter_rentals > 0 ? `${r.renter_rentals} rental${r.renter_rentals === 1 ? "" : "s"}` : "New member";
}

function RequestCard({ r, selected, best, note }: { r: OwnerRequest; selected: boolean; best?: boolean; note?: string }) {
  return (
    <Link
      href={`/owner/requests?${new URLSearchParams({ item: r.item_id, r: r.id })}`}
      aria-current={selected ? "true" : undefined}
      className={`flex flex-col gap-2 rounded-card border-2 bg-card p-4 md:p-5 ${selected ? "border-primary" : "border-border hover:border-primary-border"} ${focusRingClass}`}
    >
      <div className="flex items-center gap-3">
        <LockIcon />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="text-base">{r.status === "PAID" && r.renter ? r.renter.name : r.label}</strong>
          <span className="text-[13px] text-muted-foreground">
            {rentalsLine(r)}
            {note && ` · ${note}`}
            {r.status !== "REQUESTED" && ` · ${STATUS_LABEL[r.status]}`}
          </span>
        </span>
        <strong className="text-base">{formatNadWhole(Number(r.total))}</strong>
      </div>
      <span className="text-sm text-foreground-soft">
        {formatShortRange(r.start_date, r.end_date)}
        {r.quantity > 1 && ` · ${r.quantity} units`}
      </span>
      {best && <span className="self-start rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-ink">Best match · most rentals</span>}
    </Link>
  );
}

function RequestDetail({ r, declines, today }: { r: OwnerRequest; declines: string[]; today: string }) {
  const money = ownerMoney(Number(r.total), Number(r.fee_rate));
  const paid = r.status === "PAID";
  const waiting = r.status === "REQUESTED";
  const firstName = r.renter?.name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      <section className="flex flex-col gap-4 rounded-panel border border-border bg-card p-5 shadow-[0_16px_40px_rgba(20,40,30,.06)] md:p-7">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-extrabold md:text-[28px]">{paid && r.renter ? `${r.renter.name}'s booking` : `${r.label}'s request`}</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${waiting ? "bg-accent-soft text-accent-ink" : paid ? "bg-primary-soft text-primary-ink" : "bg-muted text-foreground-soft"}`}>
            {waiting ? expiresIn(r.expires_at) : STATUS_LABEL[r.status]}
          </span>
        </div>
        <span className="-mt-2 text-sm text-muted-foreground">{rentalsLine(r)} · ID check coming soon</span>

        {!paid && <LockedDetails rows={["Name", "Phone"]} note="Shows once you accept and pay the booking fee." />}

        <dl className="flex flex-col gap-2 border-t border-border pt-4 text-[15px]">
          <Row label="Dates" value={formatShortRange(r.start_date, r.end_date)} />
          {r.quantity > 1 && <Row label="How many" value={String(r.quantity)} />}
          <Row label="Renter pays you" value={`${formatNadWhole(Number(r.total))} + ${formatNadWhole(Number(r.deposit))} deposit`} />
        </dl>
        <dl className="flex flex-col gap-2 border-t border-border pt-4 text-[15px]">
          <div className="flex justify-between font-bold">
            <dt>Your booking fee ({money.percent}%)</dt>
            <dd>{formatNadWhole(paid ? Number(r.fee_amount) : money.fee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">You keep from the rental</dt>
            <dd className="font-bold text-primary">{formatNadWhole(money.keep)}</dd>
          </div>
        </dl>

        {waiting && !fits(r) && (
          <p className="rounded-btn border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-ink">
            Not enough free on these dates any more: another booking holds the units. Decline this one, or wait in case a booking is cancelled.
          </p>
        )}
        {waiting && (
          <>
            <p className="text-center text-[13px] text-muted-foreground">
              {declines.length > 0 && `Accepting declines ${declines.join(" and ")}, who asked for the same dates. `}
              Renter cancels or doesn&apos;t show? Claim a full refund of the fee within 30 days.
            </p>
            <p className="flex items-center justify-center gap-2 text-[13px] text-accent-ink">
              <SampleTag>Test mode</SampleTag> No money is taken until PayToday is connected.
            </p>
            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-border bg-card px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:p-0">
              <form action={declineRequest} className="flex-1">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="item" value={r.item_id} />
                <button className={buttonClasses({ variant: "white", size: "lg", className: "w-full text-danger" })}>Decline</button>
              </form>
              <form action={acceptAndPay} className="flex-[2]">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="item" value={r.item_id} />
                <button disabled={!fits(r)} className={buttonClasses({ size: "lg", className: "w-full" })}>
                  Accept and pay {formatNadWhole(money.fee)}
                </button>
              </form>
            </div>
          </>
        )}

        {paid && r.payment_reference && <p className="text-[13px] text-muted-foreground">Fee paid · reference {r.payment_reference}</p>}
        {paid && canClaimRefund(r, today) && (
          <form action={claimRefund} className="flex flex-col gap-2 rounded-card border border-border p-4">
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="item" value={r.item_id} />
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              Renter cancelled or didn&apos;t show?
              <select name="reason" className="h-11 rounded-btn-sm border border-input bg-card px-3 text-base font-normal md:text-sm">
                <option>Renter didn&apos;t show</option>
                <option>Renter cancelled</option>
              </select>
            </label>
            <button className={buttonClasses({ variant: "white", size: "sm", className: "self-start" })}>Claim the fee back</button>
          </form>
        )}
        {paid && r.refund_claimed_at && <p className="text-[13px] text-muted-foreground">Refund claimed. RentLoop is checking it.</p>}
      </section>

      {/* "After you pay · renter unlocked": a preview while waiting, the real details once paid. */}
      <section className="flex flex-col gap-3 rounded-panel bg-deep p-5 text-deep-foreground md:p-6">
        <span className="flex items-center gap-2 text-xs font-bold tracking-[.06em] text-accent uppercase">
          <LineIcon size={16}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </LineIcon>
          {paid ? "Renter unlocked" : "After you pay · renter unlocked"}
        </span>
        <dl className="flex flex-col gap-2.5 text-[15px]">
          <div className="flex justify-between gap-3">
            <dt className="text-deep-muted">Name</dt>
            <dd className="font-bold">{paid ? (r.renter?.name ?? "Renter") : "Shown after you pay"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-deep-muted">Phone</dt>
            <dd className="font-bold">{paid ? (r.renter?.phone ?? "Not given") : "Shown after you pay"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-deep-muted">Collects</dt>
            <dd className="font-bold">{formatShortRange(r.start_date, r.start_date)}</dd>
          </div>
        </dl>
        {paid && r.renter?.phone && (
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${r.renter.phone}`} className={buttonClasses({ variant: "white" })}>
              Call
            </a>
            <a href={whatsAppLink(`Hi ${firstName}, I accepted your RentLoop request for the ${r.item_name} (${formatShortRange(r.start_date, r.end_date)}). When would you like to collect?`, r.renter.phone)} className={buttonClasses({ variant: "outline" })}>
              WhatsApp
            </a>
          </div>
        )}
        {declines.length > 0 && !paid && <p className="text-sm text-deep-muted">{declines.join(" and ")} {declines.length === 1 ? "is" : "are"} told the dates are taken.</p>}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}
