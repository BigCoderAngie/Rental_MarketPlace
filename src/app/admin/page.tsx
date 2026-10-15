import Link from "next/link";
import { ErrorNote, Field, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { formatNad } from "@/lib/money";
import { METHOD_LABEL, PROOF_BUCKET, type Plan, type PlanPayment, type PlatformSettings } from "@/lib/plans";
import { reviewPayment, updatePlan, updatePlatformSettings } from "./actions";

type Row = PlanPayment & { businesses: { name: string } | null; plans: { name: string } | null };

const SAVED: Record<string, string> = {
  approved: "Approved. The plan is on for 12 months.",
  rejected: "Rejected. The business sees your reason on its plan page.",
  plan: "Plan saved.",
  settings: "Settings saved.",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "medium", timeStyle: "short" });
}

/** Platform admin: approve proofs of payment, set plan prices and limits (FR-AD-01, FR-PL-03). */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const { error, saved } = await searchParams;
  const { supabase } = await requireAdmin();

  const [{ data: pending }, { data: reviewed }, { data: plans }, { data: settings }] = await Promise.all([
    supabase
      .from("plan_payments")
      .select("*, businesses(name), plans(name)")
      .eq("status", "PENDING")
      .order("created_at")
      .returns<Row[]>(),
    supabase
      .from("plan_payments")
      .select("*, businesses(name), plans(name)")
      .neq("status", "PENDING")
      .order("reviewed_at", { ascending: false })
      .limit(20)
      .returns<Row[]>(),
    supabase.from("plans").select("*").order("sort_order").returns<Plan[]>(),
    supabase.from("platform_settings").select("*").single<PlatformSettings>(),
  ]);

  const proofUrls: Record<string, string> = {};
  if (pending && pending.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrls(pending.map((p) => p.proof_path), 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) proofUrls[s.path] = s.signedUrl;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <p className="mb-1 text-sm">
        <Link href="/calendar" className="text-muted underline">Back to the app</Link>
      </p>
      <h1 className="mb-4 text-2xl font-semibold">Admin</h1>
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      {typeof saved === "string" && SAVED[saved] && (
        <p className="mb-4 rounded-lg bg-brand-soft p-3 text-sm text-brand-ink">{SAVED[saved]}</p>
      )}

      <h2 className="mb-2 font-semibold">Payments to check ({pending?.length ?? 0})</h2>
      {!pending || pending.length === 0 ? (
        <p className="mb-6 text-sm text-muted">Nothing waiting.</p>
      ) : (
        <ul className="mb-6 space-y-3">
          {pending.map((p) => (
            <li key={p.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
              <p className="flex justify-between gap-2 font-medium">
                <span>{p.businesses?.name}</span>
                <span>{formatNad(p.amount)}</span>
              </p>
              <p className="text-muted">
                {p.plans?.name} · {METHOD_LABEL[p.method]}
                {p.reference && ` · ref ${p.reference}`} · sent {when(p.created_at)}
              </p>
              {proofUrls[p.proof_path] && (
                <a href={proofUrls[p.proof_path]} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
                  <img src={proofUrls[p.proof_path]} alt="Proof of payment" className="max-h-64 rounded-lg border border-line" />
                </a>
              )}
              <p className="mt-2 text-xs text-muted">Check the money arrived in the account before approving.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <form action={reviewPayment.bind(null, p.id, true)}>
                  <button className={`${buttonClass} w-full`}>Approve {p.plans?.name} for 12 months</button>
                </form>
                <form action={reviewPayment.bind(null, p.id, false)} className="flex gap-2">
                  <input name="note" required placeholder="Reason, e.g. amount is short" aria-label="Reason for rejecting" className={inputClass} />
                  <button className={secondaryButtonClass}>Reject</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {reviewed && reviewed.length > 0 && (
        <>
          <h2 className="mb-2 font-semibold">Recently checked</h2>
          <ul className="mb-6 divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {reviewed.map((p) => (
              <li key={p.id} className="px-4 py-2">
                {p.businesses?.name} · {p.plans?.name} · {formatNad(p.amount)} ·{" "}
                {p.status === "APPROVED" ? `Approved, ${p.invoice_number}` : `Rejected: ${p.note}`}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-1 font-semibold">Plans</h2>
      <p className="mb-2 text-sm text-muted">
        Placeholder prices until the business interviews. Leave a limit empty for unlimited. Changes apply to new
        payments; plans already paid for keep running.
      </p>
      <div className="mb-6 space-y-3">
        {(plans ?? []).map((p) => (
          <form key={p.code} action={updatePlan.bind(null, p.code)} className="rounded-xl border border-line bg-surface p-4">
            <p className="mb-2 font-medium">{p.name}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Price a year (N$)">
                <input name="yearly_price" type="number" min={0} step="0.01" required defaultValue={p.yearly_price} className={inputClass} />
              </Field>
              <Field label="Founding price (N$)">
                <input name="founding_price" type="number" min={0} step="0.01" required defaultValue={p.founding_price} className={inputClass} />
              </Field>
              <Field label="Items">
                <input name="item_limit" type="number" min={1} defaultValue={p.item_limit ?? ""} placeholder="Unlimited" className={inputClass} />
              </Field>
              <Field label="Users">
                <input name="user_limit" type="number" min={1} defaultValue={p.user_limit ?? ""} placeholder="Unlimited" className={inputClass} />
              </Field>
              <Field label="Marketplace fee (%)">
                <input name="booking_fee_percent" type="number" min={0} max={100} step="0.1" required defaultValue={Number(p.booking_fee_rate) * 100} className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-3 text-sm">
                <input name="full_reports" type="checkbox" defaultChecked={p.full_reports} className="h-5 w-5" />
                Full reports and CSV
              </label>
            </div>
            <button className={`${secondaryButtonClass} mt-3 w-full`}>Save {p.name}</button>
          </form>
        ))}
      </div>

      {settings && (
        <>
          <h2 className="mb-2 font-semibold">Payment details and invoices</h2>
          <form action={updatePlatformSettings} className="space-y-3 rounded-xl border border-line bg-surface p-4">
            <Field label="Founding prices for businesses that join by" hint="They keep founding prices for their first year">
              <input name="launch_ends_on" type="date" required defaultValue={settings.launch_ends_on} className={inputClass} />
            </Field>
            <Field label="Bank details shown to businesses">
              <textarea name="bank_details" rows={2} required defaultValue={settings.bank_details} className={inputClass} />
            </Field>
            <Field label="eWallet details shown to businesses">
              <textarea name="ewallet_details" rows={2} required defaultValue={settings.ewallet_details} className={inputClass} />
            </Field>
            <Field label="Name on invoices">
              <input name="seller_name" required defaultValue={settings.seller_name} className={inputClass} />
            </Field>
            <Field label="Address on invoices">
              <textarea name="seller_address" rows={2} required defaultValue={settings.seller_address} className={inputClass} />
            </Field>
            <Field label="VAT number" hint="Shown on invoices once registered">
              <input name="seller_vat_number" defaultValue={settings.seller_vat_number ?? ""} className={inputClass} />
            </Field>
            <button className={`${buttonClass} w-full`}>Save</button>
          </form>
        </>
      )}
    </main>
  );
}
