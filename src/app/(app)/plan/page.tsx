import Link from "next/link";
import { ErrorNote, PageHeader, buttonClass, secondaryButtonClass, upgradeBadgeClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { namibiaToday } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { limitText, loadPlan, priceFor, priceText, type PlanPayment } from "@/lib/plans";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium" });
}

/** FR-PL-01 to FR-PL-05: the business's plan, what it includes, and how to pay. */
export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const { sent, limit } = await searchParams;
  const { supabase, business } = await requireBusiness();
  const today = namibiaToday();

  const [{ plan, subscription, plans }, { data: payments }, { count: itemCount }, { count: userCount }, { data: isOwner }] =
    await Promise.all([
      loadPlan(supabase, business.id),
      supabase
        .from("plan_payments")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .returns<PlanPayment[]>(),
      supabase.from("items").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("archived", false),
      supabase.from("business_members").select("user_id", { count: "exact", head: true }).eq("business_id", business.id),
      supabase.rpc("is_business_owner", { p_business_id: business.id }),
    ]);
  if (!plan) throw new Error("Could not load the plan");

  const pending = payments?.find((p) => p.status === "PENDING");
  const lastRejected = payments?.[0]?.status === "REJECTED" ? payments[0] : undefined;
  const paidUntil = plan.code !== "free" && subscription?.expires_at ? subscription.expires_at : null;
  const founding = subscription?.founding_until && today <= subscription.founding_until ? subscription.founding_until : null;

  return (
    <>
      <PageHeader title="Your plan" />
      {limit === "items" && (
        <p className="mb-4 rounded-lg bg-gold-soft p-3 text-sm text-gold-ink">
          You have reached the {plan.item_limit} items your {plan.name} plan allows. Upgrade to add more.
        </p>
      )}
      {sent && (
        <p className="mb-4 rounded-lg bg-brand-soft p-3 text-sm text-brand-ink">
          Thank you. We will check your payment and switch your plan on, usually within one working day.
        </p>
      )}

      <section className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm">
        <p className="text-lg font-semibold">{plan.name}</p>
        <p className="text-muted">{paidUntil ? `Paid until ${when(paidUntil)}` : "Free for as long as you like"}</p>
        <ul className="mt-3 space-y-1">
          <li className="flex justify-between">
            <span>Items</span>
            <span>{itemCount ?? 0} of {plan.item_limit ?? "unlimited"}</span>
          </li>
          <li className="flex justify-between">
            <span>Users</span>
            <span>{userCount ?? 1} of {plan.user_limit ?? "unlimited"}</span>
          </li>
          <li className="flex justify-between">
            <span>Reports</span>
            <span>{plan.full_reports ? "Full, with CSV downloads" : "Money and bookings"}</span>
          </li>
        </ul>
      </section>

      {pending && (
        <p className="mb-4 rounded-lg bg-info-soft p-3 text-sm text-info-ink">
          Your payment of {formatNad(pending.amount)} for {plans.find((p) => p.code === pending.plan_code)?.name} is
          waiting for approval (sent {when(pending.created_at)}).
        </p>
      )}
      {lastRejected && !pending && (
        <ErrorNote message={`We could not approve your last payment: ${lastRejected.note}`} />
      )}

      {founding && (
        <p className="mb-3 text-sm text-muted">
          You joined at launch, so you pay founding prices until {when(`${founding}T12:00:00Z`)}.
        </p>
      )}

      <ul className="mb-6 space-y-3">
        {plans.map((p) => {
          const price = priceFor(p, subscription, today);
          const current = p.code === plan.code;
          return (
            <li key={p.code} className={`rounded-xl border bg-surface p-4 text-sm ${current ? "border-brand" : "border-line"}`}>
              <p className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold">
                  {p.name}
                  {current && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-ink">Current</span>}
                </span>
                <span className="font-semibold">{priceText(price)}</span>
              </p>
              {price > 0 && price < Number(p.yearly_price) && (
                <p className="mt-1 text-right text-xs text-muted">
                  <span className={upgradeBadgeClass}>Founding price</span> then {formatNad(p.yearly_price)} a year
                </p>
              )}
              <ul className="mt-2 space-y-0.5 text-ink-soft">
                <li>{limitText(p.item_limit, "items")}</li>
                <li>{limitText(p.user_limit, p.user_limit === 1 ? "user" : "users")}</li>
                <li>{p.full_reports ? "Full reports and CSV downloads" : "Money and booking reports"}</li>
                <li className="text-muted">
                  Marketplace booking fee {Math.round(Number(p.booking_fee_rate) * 100)}% when the marketplace opens
                </li>
              </ul>
              {isOwner && p.code !== "free" && !pending && (
                <Link href={`/plan/pay?plan=${p.code}`} className={`${current ? secondaryButtonClass : buttonClass} mt-3 w-full`}>
                  {current ? `Renew ${p.name}` : `Choose ${p.name}`}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {!isOwner && <p className="mb-6 text-sm text-muted">Only the business owner can change the plan.</p>}

      {payments && payments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">Payments</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  {plans.find((x) => x.code === p.plan_code)?.name} · {formatNad(p.amount)}
                  <span className="block text-xs text-muted">
                    {when(p.created_at)} · {p.status === "PENDING" ? "Waiting for approval" : p.status === "APPROVED" ? "Approved" : "Not approved"}
                  </span>
                </span>
                {p.status === "APPROVED" && (
                  <Link href={`/plan/invoices/${p.id}`} className="shrink-0 text-sm font-medium text-brand underline">
                    Invoice {p.invoice_number}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
