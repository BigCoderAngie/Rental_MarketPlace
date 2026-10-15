import Link from "next/link";
import { PageHeader, inputClass, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { customerSearchFilter, type CustomerSummary } from "@/lib/customers";
import { formatNad } from "@/lib/money";

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const { q } = await searchParams;
  const { supabase, business } = await requireBusiness();

  let query = supabase
    .from("customer_summaries")
    .select("*")
    .eq("business_id", business.id)
    .order("full_name")
    .limit(200);
  const filter = customerSearchFilter(q);
  if (filter) query = query.or(filter);
  const { data: customers, error } = await query.returns<CustomerSummary[]>();
  if (error) throw error;

  return (
    <>
      <PageHeader title="Customers" />
      <form method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={typeof q === "string" ? q : ""}
          placeholder="Name or phone number"
          aria-label="Search customers"
          className={inputClass}
        />
        <button className={secondaryButtonClass}>Search</button>
      </form>

      {customers.length === 0 ? (
        <p className="text-sm text-muted">
          {filter ? "No customer matches that search." : "Customers appear here after their first booking."}
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {customers.map((c) => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.full_name}</span>
                  <span className="text-sm text-muted">
                    {c.phone} · {c.bookings} booking{c.bookings === 1 ? "" : "s"}
                  </span>
                </span>
                {Number(c.outstanding) > 0 && (
                  <span className="shrink-0 text-right text-sm font-medium text-danger">
                    {formatNad(c.outstanding)} owed
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
