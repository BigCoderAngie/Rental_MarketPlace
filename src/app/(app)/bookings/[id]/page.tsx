import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { PackageLines } from "@/components/package-lines";
import { StatusBadge } from "@/components/status-badge";
import { requireBusiness } from "@/lib/business";
import { EDITABLE_STATUSES, STATUS_LABEL, staffActions, type BookingStatus } from "@/lib/bookings";
import { daysInclusive, formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { packageContents, type Package, type PackageItem } from "@/lib/packages";
import { quoteTotals } from "@/lib/quotes";
import { PHOTO_BUCKET, type Handover } from "@/lib/handovers";
import type { Balance, Payment } from "@/lib/payments";
import { siteUrl } from "@/lib/site-url";
import type { Booking } from "@/lib/types";
import { moveBooking } from "../actions";
import { HandoverSection } from "./handover-section";
import { MoneySection } from "./money-section";

type Detail = Booking & {
  public_token: string;
  payments: Payment[];
  handovers: Handover[];
  customers: { full_name: string; phone: string } | null;
  booking_items: { item_id: string; quantity: number; package_units: number; daily_price: number; items: { name: string } | null }[];
  booking_packages: { quantity: number; daily_price: number; packages: (Pick<Package, "name"> & { package_items: PackageItem[] }) | null }[];
  booking_events: { id: number; from_status: BookingStatus | null; to_status: BookingStatus; note: string | null; created_at: string }[];
};

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  ACCEPTED: "Accept and confirm",
  DECLINED: "Decline",
  CANCELLED: "Cancel booking",
  PROBLEM_OPEN: "Report a problem",
  CLOSED: "Close booking",
};

const NEEDS_NOTE: BookingStatus[] = ["CANCELLED", "DECLINED", "PROBLEM_OPEN"];

export default async function BookingPage({ params, searchParams }: PageProps<"/bookings/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, customers(full_name, phone), booking_items(item_id, quantity, package_units, daily_price, items(name)), booking_packages(quantity, daily_price, packages(name, package_items(item_id, quantity, items(name)))), booking_events(id, from_status, to_status, note, created_at), payments(*), handovers(*, handover_lines(*, items(name)), handover_photos(id, storage_path))")
    .eq("id", id)
    .order("id", { referencedTable: "booking_events" })
    .order("paid_on", { referencedTable: "payments" })
    .maybeSingle<Detail>();
  if (!booking) notFound();

  const { data: balance } = await supabase
    .from("booking_balances")
    .select("*")
    .eq("booking_id", id)
    .single<Balance>();
  const photoPaths = booking.handovers.flatMap((h) => h.handover_photos.map((p) => p.storage_path));
  const photoUrls: Record<string, string> = {};
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photoPaths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) photoUrls[s.path] = s.signedUrl;
  }

  const link = `${await siteUrl()}/b/${booking.public_token}`;
  const firstName = booking.customers?.full_name.split(/\s+/)[0] ?? "";
  const shareMessage = `Hi ${firstName}, here are the details of your booking ${booking.reference} with ${business.name}: ${link}`;

  const days = daysInclusive(booking.start_date, booking.end_date);
  const { total } = quoteTotals({ ...booking, lines: booking.booking_items, packages: booking.booking_packages });
  const actions = staffActions(booking.status);

  return (
    <>
      <PageHeader title={booking.reference} action={<StatusBadge status={booking.status} />} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />

      <section className="mb-4 rounded-xl border border-border bg-card p-4">
        <Link href={`/customers/${booking.customer_id}`} className="block font-medium underline">{booking.customers?.full_name}</Link>
        <p className="text-sm text-muted-foreground">{booking.customers?.phone}</p>
        <p className="mt-2 text-sm">{formatRange(booking.start_date, booking.end_date)} ({days} day{days > 1 ? "s" : ""})</p>
        {booking.status === "REQUESTED" && booking.request_expires_at && (
          <p className="mt-2 text-sm font-medium text-accent-ink">
            Accept or decline by {new Date(booking.request_expires_at).toLocaleString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium", timeStyle: "short" })}, or the request expires.
          </p>
        )}
        {booking.notes && <p className="mt-2 text-sm text-muted-foreground">{booking.notes}</p>}
        {EDITABLE_STATUSES.includes(booking.status) && (
          <Link href={`/bookings/${booking.id}/edit`} className="mt-3 inline-block text-sm font-medium text-primary underline">
            Change dates or items
          </Link>
        )}
      </section>

      <section className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
        <ul className="space-y-1">
          <PackageLines
            days={days}
            packages={booking.booking_packages.map((bp) => ({
              name: bp.packages?.name ?? "",
              quantity: bp.quantity,
              daily_price: bp.daily_price,
              contents: bp.packages ? packageContents(bp.packages) : undefined,
            }))}
          />
          {booking.booking_items.filter((bi) => bi.quantity > bi.package_units).map((bi, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{bi.quantity - bi.package_units} × {bi.items?.name}</span>
              <span>{formatNad((bi.quantity - bi.package_units) * bi.daily_price * days)}</span>
            </li>
          ))}
          {Number(booking.delivery_fee) > 0 && (
            <li className="flex justify-between"><span>Delivery</span><span>{formatNad(booking.delivery_fee)}</span></li>
          )}
          {Number(booking.setup_fee) > 0 && (
            <li className="flex justify-between"><span>Setup</span><span>{formatNad(booking.setup_fee)}</span></li>
          )}
          {Number(booking.discount) > 0 && (
            <li className="flex justify-between"><span>Discount</span><span>−{formatNad(booking.discount)}</span></li>
          )}
        </ul>
        <p className="mt-3 flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatNad(total)}</span>
        </p>
      </section>

      {balance && (
        <MoneySection
          bookingId={booking.id}
          balance={balance}
          expectedDeposit={booking.deposit_amount}
          payments={booking.payments}
          link={link}
          shareMessage={shareMessage}
          customerPhone={booking.customers?.phone}
        />
      )}

      <HandoverSection
        businessId={business.id}
        bookingId={booking.id}
        status={booking.status}
        bookedItems={booking.booking_items.map((bi) => ({ item_id: bi.item_id, name: bi.items?.name ?? "", quantity: bi.quantity }))}
        handovers={booking.handovers}
        photoUrls={photoUrls}
      />

      {actions.length > 0 && (
        <section className="mb-4 space-y-3">
          {actions.map((to) =>
            NEEDS_NOTE.includes(to) ? (
              <form key={to} action={moveBooking.bind(null, booking.id, to)} className="space-y-2 rounded-xl border border-border bg-card p-3">
                <Field label={to === "PROBLEM_OPEN" ? "What went wrong?" : "Reason"}>
                  <input name="note" required className={inputClass} />
                </Field>
                <button className={`${secondaryButtonClass} w-full`}>{ACTION_LABEL[to]}</button>
              </form>
            ) : (
              <form key={to} action={moveBooking.bind(null, booking.id, to)}>
                <button className={`${buttonClass} w-full`}>{ACTION_LABEL[to] ?? STATUS_LABEL[to]}</button>
              </form>
            ),
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground-soft">History</h2>
        <ol className="space-y-1 text-sm text-muted-foreground">
          {booking.booking_events.map((e) => (
            <li key={e.id}>
              {new Date(e.created_at).toLocaleString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium", timeStyle: "short" })}
              {" · "}
              {STATUS_LABEL[e.to_status]}
              {e.note && ` · ${e.note}`}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
