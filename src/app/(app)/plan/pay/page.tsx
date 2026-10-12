import { notFound } from "next/navigation";
import { PhotoUpload } from "@/components/photo-upload";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { namibiaToday } from "@/lib/dates";
import { formatNad } from "@/lib/money";
import { METHOD_LABEL, PROOF_BUCKET, loadPlan, priceFor, type PlatformSettings } from "@/lib/plans";
import { requestPlan } from "../actions";

/** FR-PL-03: pay for Pro or Business by bank deposit or eWallet and upload the proof. */
export default async function PayPage({ searchParams }: PageProps<"/plan/pay">) {
  const { plan: code, error } = await searchParams;
  const { supabase, business } = await requireBusiness();
  const [{ subscription, plans }, { data: settings }] = await Promise.all([
    loadPlan(supabase, business.id),
    supabase.from("platform_settings").select("*").single<PlatformSettings>(),
  ]);
  const chosen = plans.find((p) => p.code === code && p.code !== "free");
  if (!chosen || !settings) notFound();
  const amount = priceFor(chosen, subscription, namibiaToday());
  const reference = business.name.replace(/[^A-Za-z0-9 ]/g, "").trim().slice(0, 20).toUpperCase();

  return (
    <>
      <PageHeader title={`Pay for ${chosen.name}`} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />

      <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
        <p className="flex justify-between text-base font-semibold">
          <span>{chosen.name}, 12 months</span>
          <span>{formatNad(amount)}</span>
        </p>
        <p className="mt-3 font-medium">1. Pay {formatNad(amount)} by bank deposit, EFT or eWallet</p>
        <p className="mt-1 whitespace-pre-line text-zinc-700">{settings.bank_details}</p>
        <p className="mt-1 whitespace-pre-line text-zinc-700">{settings.ewallet_details}</p>
        <p className="mt-1 text-zinc-700">
          Use <span className="font-semibold">{reference || "your business name"}</span> as the reference.
        </p>
        <p className="mt-3 font-medium">2. Send us the proof below</p>
        <p className="mt-1 text-zinc-600">We switch your plan on for 12 months when we have checked it.</p>
      </section>

      <form action={requestPlan.bind(null, chosen.code)} className="space-y-4">
        <Field label="How did you pay?">
          <select name="method" className={inputClass} defaultValue="bank_deposit">
            {Object.entries(METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Payment reference (optional)" hint="The reference or transaction number on your slip">
          <input name="reference" defaultValue={reference} className={inputClass} />
        </Field>
        <PhotoUpload
          bucket={PROOF_BUCKET}
          folder={business.id}
          name="proof_path"
          label="Proof of payment (photo or screenshot)"
          multiple={false}
        />
        <button className={`${buttonClass} w-full`}>Send proof of payment</button>
      </form>
    </>
  );
}
