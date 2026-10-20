import Link from "next/link";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { Badge, StatusBadge } from "@/components/status-badge";
import { requireBusiness } from "@/lib/business";
import { formatDate, formatRange, namibiaToday } from "@/lib/dates";
import { isOverdue, wentAhead, type BookingStatus } from "@/lib/bookings";
import { formatNad } from "@/lib/money";
import { paymentState, type Balance } from "@/lib/payments";
import { readByIds } from "@/lib/batches";
import { TODAY_LABEL, isLatePickup, isTodayFilter, loadToday } from "@/lib/today";

type Row = {
  id: string;
  reference: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  customers: { full_name: string } | null;
  booking_items: { quantity: number; items: { name: string } | null }[];
};

const OPEN: BookingStatus[] = ["REQUESTED", "ACCEPTED", "FEE_PENDING", "CONFIRMED", "CHECKED_OUT", "OVERDUE", "RETURNED", "PROBLEM_OPEN"];

export default async function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  const { show, filter: filterParam } = await searchParams;
  const showAll = show === "all";
  // ?filter=… comes from the Today cards on the calendar: show exactly the bookings that card counted.
  const filter = isTodayFilter(filterParam) ? filterParam : null;
  const { supabase, business } = await requireBusiness();
  const summary = filter ? await loadToday(supabase, business.id) : null;
  const filterIds = filter && summary ? summary.ids[filter] : null;

  const columns = "id, reference, status, start_date, end_date, customers(full_name), booking_items(quantity, items(name))";
  const bookings = filterIds
    ? // Every booking the card counted (no 200 cap), fetched in batches so the request stays short.
      (await readByIds(filterIds, (ids) => supabase.from("bookings").select(columns).in("id", ids).returns<Row[]>())).sort((a, b) =>
        a.start_date.localeCompare(b.start_date),
      )
    : await listBookings();

  async function listBookings() {
    let query = supabase.from("bookings").select(columns).eq("business_id", business.id).order("start_date").limit(200);
    if (!showAll) query = query.in("status", OPEN);
    const { data, error } = await query.returns<Row[]>();
    if (error) throw error;
    return data;
  }

  const balances = await readByIds(bookings.map((b) => b.id), (ids) =>
    supabase
      .from("booking_balances")
      .select("booking_id, amount_due, amount_paid, outstanding")
      .in("booking_id", ids)
      .returns<(Pick<Balance, "amount_due" | "amount_paid" | "outstanding"> & { booking_id: string })[]>(),
  );
  // Invite a first booking only when the business has none at all, not when the open list happens to be empty.
  // A filtered list or "show all" already answers that, so only the open list needs the count.
  let hasAnyBooking = bookings.length > 0 || Boolean(filter);
  if (!hasAnyBooking && !showAll) {
    const { count, error: countError } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);
    if (countError) throw countError;
    hasAnyBooking = (count ?? 0) > 0;
  }
  const today = summary?.today ?? namibiaToday();
  // On "Going out today", late pickups come first so they get dealt with.
  if (filter === "out-today") bookings.sort((a, b) => Number(isLatePickup(b, today)) - Number(isLatePickup(a, today)));
  const balanceById = new Map(balances.map((b) => [b.booking_id, b]));

  return (
    <>
      <PageHeader title="Bookings" action={<LinkButton href="/bookings/new">New booking</LinkButton>} />
      {filter ? (
        <p className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold">
            {TODAY_LABEL[filter]} ({bookings.length})
          </span>
          <Link href="/bookings" className="text-sm underline">Show open bookings</Link>
        </p>
      ) : (
        <p className="mb-3 text-sm">
          {showAll ? (
            <Link href="/bookings" className="underline">Show open bookings only</Link>
          ) : (
            <Link href="/bookings?show=all" className="underline">Show all, including closed and cancelled</Link>
          )}
        </p>
      )}

      {!hasAnyBooking ? (
        <EmptyState
          message="Bookings for phone, walk-in and WhatsApp customers go here."
          actionHref="/bookings/new"
          actionLabel="Add your first booking"
        />
      ) : bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">{filter ? "No bookings here right now." : "No open bookings."}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/bookings/${b.id}`} className="block px-4 py-3">
                <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="font-medium">{b.customers?.full_name}</span>
                  <span className="flex flex-wrap items-center justify-end gap-1">
                    {b.status === "CHECKED_OUT" && isOverdue(b.status, b.end_date, today) && (
                      <Badge tone="danger">Late</Badge>
                    )}
                    {filter === "out-today" && isLatePickup(b, today) && (
                      <Badge tone="danger">Late pickup since {formatDate(b.start_date)}</Badge>
                    )}
                    <StatusBadge status={b.status} />
                  </span>
                </span>
                <span className="block text-sm text-muted-foreground">
                  {formatRange(b.start_date, b.end_date)} · {b.reference}
                  {balanceById.has(b.id) && <> · {moneyLine(balanceById.get(b.id)!, b.status)}</>}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {b.booking_items.map((bi) => `${bi.quantity} × ${bi.items?.name}`).join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Only money owed on bookings that went ahead is shown as unpaid (terracotta).
function moneyLine(b: Pick<Balance, "amount_due" | "amount_paid" | "outstanding">, status: BookingStatus) {
  const state = paymentState(b);
  if (state === "Paid") return "Paid";
  const outstanding = Math.max(Number(b.outstanding), 0);
  const text = `${formatNad(outstanding)} outstanding`;
  return outstanding > 0 && wentAhead(status) ? <span className="text-danger">{text}</span> : text;
}
