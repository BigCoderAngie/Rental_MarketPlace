import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { wentAhead, type BookingStatus } from "@/lib/bookings";
import type { CustomerSummary } from "@/lib/customers";
import { formatRange } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { whatsAppLink } from "@/lib/whatsapp";
import { updateCustomer } from "../actions";

type BookingRow = {
  id: string;
  reference: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  booking_balances: { amount_due: number; outstanding: number } | null;
};

export default async function CustomerPage({ params, searchParams }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const { supabase, business } = await requireBusiness();

  const [{ data: customer }, { data: bookings }] = await Promise.all([
    supabase.from("customer_summaries").select("*").eq("id", id).maybeSingle<CustomerSummary>(),
    supabase
      .from("bookings")
      .select("id, reference, status, start_date, end_date")
      .eq("customer_id", id)
      .order("start_date", { ascending: false })
      .returns<Omit<BookingRow, "booking_balances">[]>(),
  ]);
  if (!customer) notFound();

  const { data: balances } = await supabase
    .from("booking_balances")
    .select("booking_id, amount_due, outstanding")
    .in("booking_id", (bookings ?? []).map((b) => b.id))
    .returns<{ booking_id: string; amount_due: number; outstanding: number }[]>();
  const balanceById = new Map((balances ?? []).map((b) => [b.booking_id, b]));
  const firstName = customer.full_name.split(/\s+/)[0];

  return (
    <>
      <PageHeader title={customer.full_name} action={<Link href={`/bookings/new?${new URLSearchParams({ customer_name: customer.full_name, customer_phone: customer.phone })}`} className={secondaryButtonClass}>New booking</Link>} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      {saved && <p className="mb-4 rounded-lg bg-brand-soft p-3 text-sm text-brand-ink">Saved.</p>}

      <section className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="font-medium underline">{customer.phone}</a>
          <a href={whatsAppLink(`Hi ${firstName}, this is ${business.name}. `, customer.phone)} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">
            WhatsApp
          </a>
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-muted">Bookings</dt>
            <dd className="font-semibold">{customer.bookings}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Total value</dt>
            <dd className="font-semibold">{formatNad(customer.total_value)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Still owed</dt>
            <dd className={`font-semibold ${Number(customer.outstanding) > 0 ? "text-danger" : ""}`}>{formatNad(customer.outstanding)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Deposit held</dt>
            <dd className="font-semibold">{formatNad(customer.deposit_held)}</dd>
          </div>
        </dl>
        {customer.notes && <p className="mt-3 whitespace-pre-line rounded-lg bg-gold-soft p-3 text-gold-ink">{customer.notes}</p>}
      </section>

      <h2 className="mb-2 text-sm font-semibold text-ink-soft">Bookings</h2>
      {(bookings ?? []).length === 0 ? (
        <p className="mb-4 text-sm text-muted">No bookings yet.</p>
      ) : (
        <ul className="mb-6 divide-y divide-line rounded-xl border border-line bg-surface">
          {bookings!.map((b) => {
            const bal = balanceById.get(b.id);
            return (
              <li key={b.id}>
                <Link href={`/bookings/${b.id}`} className="block px-4 py-3 text-sm">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{formatRange(b.start_date, b.end_date)}</span>
                    <StatusBadge status={b.status} />
                  </span>
                  <span className="block text-muted">
                    {b.reference}
                    {bal && ` · ${formatNad(bal.amount_due)}`}
                    {bal && wentAhead(b.status) && Number(bal.outstanding) > 0 && (
                      <> · <span className="text-danger">{formatNad(bal.outstanding)} owed</span></>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <details className="rounded-xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold">Edit details and notes</summary>
        <form action={updateCustomer.bind(null, customer.id)} className="mt-3 space-y-3">
          <Field label="Name">
            <input name="full_name" required defaultValue={customer.full_name} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input name="phone" type="tel" required defaultValue={customer.phone} className={inputClass} />
          </Field>
          <Field label="Notes (only your staff see these)">
            <textarea name="notes" rows={3} defaultValue={customer.notes ?? ""} placeholder="e.g. Pays cash at pickup; always needs delivery" className={inputClass} />
          </Field>
          <button className={`${buttonClass} w-full`}>Save</button>
        </form>
      </details>
    </>
  );
}
