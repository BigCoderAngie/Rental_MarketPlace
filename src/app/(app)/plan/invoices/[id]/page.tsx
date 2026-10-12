import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireBusiness } from "@/lib/business";
import { formatNad } from "@/lib/money";
import { METHOD_LABEL, type Plan, type PlanPayment, type PlatformSettings } from "@/lib/plans";

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-NA", { timeZone: "Africa/Windhoek", dateStyle: "long" });
}

/** An invoice for an approved plan payment, to print or save as PDF. */
export default async function InvoicePage({ params }: PageProps<"/plan/invoices/[id]">) {
  const { id } = await params;
  const { supabase, business } = await requireBusiness();
  const [{ data: payment }, { data: settings }] = await Promise.all([
    supabase
      .from("plan_payments")
      .select("*, plans(name)")
      .eq("id", id)
      .eq("status", "APPROVED")
      .maybeSingle<PlanPayment & { plans: Pick<Plan, "name"> | null }>(),
    supabase.from("platform_settings").select("*").single<PlatformSettings>(),
  ]);
  if (!payment || !settings || !payment.starts_at || !payment.ends_at) notFound();

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 text-sm print:border-0">
      <header className="mb-5 flex justify-between gap-4">
        <div>
          <p className="font-semibold">{settings.seller_name}</p>
          <p className="whitespace-pre-line text-zinc-600">{settings.seller_address}</p>
          {settings.seller_vat_number && <p className="text-zinc-600">VAT number {settings.seller_vat_number}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">Invoice</p>
          <p>{payment.invoice_number}</p>
          <p className="text-zinc-600">{day(payment.reviewed_at ?? payment.starts_at)}</p>
        </div>
      </header>

      <p className="text-zinc-600">Billed to</p>
      <p className="mb-5 font-medium">{business.name}</p>

      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-600">
            <th className="py-1 font-normal">Description</th>
            <th className="py-1 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-200">
            <td className="py-2">
              {payment.plans?.name} plan, 12 months
              <span className="block text-xs text-zinc-500">{day(payment.starts_at)} to {day(payment.ends_at)}</span>
            </td>
            <td className="py-2 text-right">{formatNad(payment.amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-2 font-semibold">Total paid</td>
            <td className="pt-2 text-right font-semibold">{formatNad(payment.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-4 text-zinc-600">
        Paid by {METHOD_LABEL[payment.method]}
        {payment.reference && `, reference ${payment.reference}`}.
      </p>
      <div className="mt-6">
        <PrintButton />
      </div>
    </article>
  );
}
