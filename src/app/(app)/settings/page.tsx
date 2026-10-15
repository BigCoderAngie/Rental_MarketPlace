import Link from "next/link";
import { ErrorNote, Field, PageHeader, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { updateBusiness } from "./actions";

// Business details shown on quotes (FR-AC-02, FR-QT-03).
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { error, saved } = await searchParams;
  const { business } = await requireBusiness();

  return (
    <>
      <PageHeader title="Business details" action={<Link href="/plan" className={secondaryButtonClass}>Your plan</Link>} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      {saved === "1" && (
        <p className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-ink">Saved.</p>
      )}

      <form action={updateBusiness} className="space-y-4">
        <Field label="Business name">
          <input name="name" required defaultValue={business.name} className={inputClass} />
        </Field>
        <Field label="Towns you serve" hint="Separate towns with commas">
          <input name="towns" defaultValue={business.towns.join(", ")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input name="phone" type="tel" defaultValue={business.phone ?? ""} className={inputClass} />
          </Field>
          <Field label="WhatsApp" hint="Customers use it to ask about a quote">
            <input name="whatsapp" type="tel" defaultValue={business.whatsapp ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="Quotes are valid for (days)">
          <input name="quote_validity_days" type="number" min={1} max={90} defaultValue={business.quote_validity_days} className={inputClass} />
        </Field>
        <Field label="Answer booking requests within (hours)" hint="Requests you haven't accepted or declined by then expire automatically">
          <input name="request_expiry_hours" type="number" min={1} max={168} defaultValue={business.request_expiry_hours} className={inputClass} />
        </Field>
        <Field label="Payment terms" hint="Shown on every quote, for example: 50% to confirm, balance on delivery. EFT or cash.">
          <textarea name="payment_terms" rows={2} defaultValue={business.payment_terms ?? ""} className={inputClass} />
        </Field>
        <Field label="Rental terms" hint="Shown on every quote: damage, late returns, cleaning and so on">
          <textarea name="terms" rows={4} defaultValue={business.terms ?? ""} className={inputClass} />
        </Field>
        <button className={`${buttonClass} w-full`}>Save</button>
      </form>
    </>
  );
}
