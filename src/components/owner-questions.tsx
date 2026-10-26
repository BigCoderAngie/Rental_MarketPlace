import { CheckboxRow, ChoiceCard, LineIcon, Required, TextField } from "@/components/auth-fields";

/**
 * The questions every owner answers once (docs/build-kit/reference/desktop/SiteOwnerSignUp2.html):
 * individual or hire business, business name, the "verify your ID later" note
 * and the required booking fee box. Shown on "Before you list" (/owner/setup)
 * the first time someone lists an item.
 */
export function OwnerQuestions({ errors }: { errors: Record<string, string> }) {
  return (
    <>
      <fieldset>
        <legend className="mb-2.5 text-[13px] font-semibold">
          You are listing as
          <Required />
        </legend>
        <div className="grid gap-2.5 md:grid-cols-2 md:gap-3.5">
          <ChoiceCard name="ownerKind" value="individual" defaultChecked tone="green" title="An individual" line="I own things I don't use every day" icon={<LineIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></LineIcon>} />
          <ChoiceCard name="ownerKind" value="business" tone="yellow" title="A hire business" line="Staff, quotes and checkout records" icon={<LineIcon><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></LineIcon>} />
        </div>
        {errors.ownerKind && <p className="mt-1.5 text-[13px] font-medium text-danger">{errors.ownerKind}</p>}
      </fieldset>
      <TextField label="Business name" name="businessName" autoComplete="organization" placeholder="Only if you are a hire business" error={errors.businessName} />
      <div className="flex items-center gap-3.5 rounded-[16px] border border-primary-border bg-primary-soft px-[18px] py-4">
        <span aria-hidden className="flex h-11 w-11 flex-none items-center justify-center rounded-btn-sm bg-primary text-primary-foreground">
          <LineIcon>
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            <path d="M9 12l2 2 4-4" />
          </LineIcon>
        </span>
        <span className="flex flex-col gap-0.5">
          <strong>Verify your ID after sign up</strong>
          <span className="text-sm text-foreground-soft">Take a photo of your ID in the app. Verified owners show up first in search.</span>
        </span>
      </div>
      <CheckboxRow name="feeAcknowledged" required error={errors.feeAcknowledged}>
        I understand I pay a small booking fee only when I accept a renter
        <Required />
      </CheckboxRow>
    </>
  );
}
