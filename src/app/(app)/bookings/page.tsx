import Link from "next/link";
import { LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { requireBusiness } from "@/lib/business";
import { formatRange, namibiaToday } from "@/lib/dates";
import { isOverdue, wentAhead, type BookingStatus } from "@/lib/bookings";
import { formatNad } from "@/lib/money";
import { paymentState, type Balance } from "@/lib/payments";

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
  const { show } = await searchParams;
  const showAll = show === "all";
  const { supabase, business } = await requireBusiness();

  let query = supabase
    .from("bookings")
    .select("id, reference, status, start_date, end_date, customers(full_name), booking_items(quantity, items(name))")
    .eq("business_id", business.id)
    .order("start_date")
    .limit(200);
  if (!showAll) query = query.in("status", OPEN);

  const { data: bookings, error } = await query.returns<Row[]>();
  if (error) throw error;

  const { data: balances } = await supabase
    .from("booking_balances")
    .select("booking_id, amount_due, amount_paid, outstanding")
    .in("booking_id", bookings.map((b) => b.id))
    .returns<(Pick<Balance, "amount_due" | "amount_paid" | "outstanding"> & { booking_id: string })[]>();
  const today = namibiaToday();
  const balanceById = new Map((balances ?? []).map((b) => [b.booking_id, b]));

  return (
    <>
      <PageHeader title="Bookings" action={<LinkButton href="/bookings/new">New booking</LinkButton>} />
      <p className="mb-3 text-sm">
        {showAll ? (
          <Link href="/bookings" className="underline">Show open bookings only</Link>
        ) : (
          <Link href="/bookings?show=all" className="underline">Show all, including closed and cancelled</Link>
        )}
      </p>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/bookings/${b.id}`} className="block px-4 py-3">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{b.customers?.full_name}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {b.status === "CHECKED_OUT" && isOverdue(b.status, b.end_date, today) && (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger-ink">Late</span>
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
