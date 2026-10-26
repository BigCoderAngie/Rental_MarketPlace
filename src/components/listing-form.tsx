"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { saveListing, type ListingState } from "@/app/(focus)/owner/list/actions";
import { FormMessage, TextField } from "@/components/auth-fields";
import { BookingCard } from "@/components/booking-card";
import { Button, buttonClasses, focusRingClass } from "@/components/button";
import { CATEGORY_ICONS } from "@/components/category-tiles";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { ListingPhotos, type UploadedPhoto } from "@/components/listing-photos";
import { LogoMark } from "@/components/logo";
import { COLLECTION_TOWNS, MAX_TITLE, parseAmount } from "@/lib/listing";
import { CONDITIONS } from "@/lib/requests";
import { CATEGORIES } from "@/lib/site-links";

const STEPS = ["Category", "Details and price", "Photos and place"] as const;
const card = "flex flex-col gap-5 rounded-card border border-border bg-card p-5 md:p-7";
const chip = `${buttonClasses({ variant: "white", size: "chip" })} cursor-pointer has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-checked:[--edge:var(--primary-edge)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary`;
const tile = "b3 rl-btn rl-w h-auto cursor-pointer flex-col gap-2 px-2 py-4 text-sm has-checked:border-2 has-checked:border-primary has-checked:bg-primary-soft has-checked:[--edge:var(--primary)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary";

/**
 * List an item (docs/build-kit/reference/desktop/SiteList.html and
 * mobile/SiteList.html). Desktop: the steps on the left, all three form cards
 * in the middle, the live preview, "How you get paid" and Publish on the right.
 * Phones: one step at a time with progress bars and a sticky button.
 */
export function ListingForm({ defaultTown }: { defaultTown: string }) {
  const [state, formAction, pending] = useActionState<ListingState, FormData>(saveListing, {});
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const errors = state.errors ?? {};

  // Phones show one step at a time: when new problems come back, open the step holding the first one.
  const [seenErrors, setSeenErrors] = useState(state.errors);
  if (state.errors !== seenErrors) {
    setSeenErrors(state.errors);
    const keys = Object.keys(state.errors ?? {});
    const stepOf = (k: string) => (k === "category" ? 0 : ["photos", "town", "area"].includes(k) ? 2 : 1);
    if (keys.length) setStep(Math.min(...keys.map(stepOf)));
  }
  const done = [Boolean(category), Boolean(title && price), photos.length > 0 && Boolean(area)];

  // Call the action ourselves so a server problem doesn't clear the form (React resets forms after a form action).
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  const show = (i: number) => (step === i ? "" : "hidden md:flex");
  const categoryLabel = CATEGORIES.find((c) => c.slug === category)?.label ?? "Category";

  return (
    <form id="listing-form" onSubmit={submit} noValidate className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="wrap flex min-h-[64px] items-center gap-3 py-2 md:min-h-20 md:gap-5">
          <Link href="/owner" aria-label="Close" className={`flex h-11 w-11 flex-none items-center justify-center rounded ${focusRingClass}`}>
            <CloseIcon />
          </Link>
          <span className="hidden md:block">
            <LogoMark size={38} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-lg md:text-2xl">List an item</strong>
            <span className="hidden text-sm text-muted-foreground md:block">Renters see your item, never your name or number, until you accept a booking.</span>
            <span className="text-[13px] text-muted-foreground md:hidden">
              Step {step + 1} of 3 · {STEPS[step]}
            </span>
          </span>
          <button type="submit" name="intent" value="draft" disabled={pending} className={buttonClasses({ variant: "white", size: "sm", className: "md:h-12 md:px-5 md:text-[15px]" })}>
            Save as draft
          </button>
        </div>
      </header>

      <div className="wrap pt-4 pb-32 md:pt-7 md:pb-16">
        {/* Phones: progress bars */}
        <div aria-hidden className="mb-4 flex gap-2 md:hidden">
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-[3px] ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
          <ol className="sticky top-28 hidden flex-col gap-3 lg:flex">
            {STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 rounded-card border-2 bg-card px-4 py-3.5 font-semibold ${!done[i] && done.slice(0, i).every(Boolean) ? "border-primary" : "border-border"}`}>
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-extrabold ${done[i] ? "bg-primary text-primary-foreground" : "bg-muted text-foreground-soft"}`}>
                  {done[i] ? <CheckIcon size={14} /> : i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-5">
            <FormMessage message={state.message} />

            <section className={`${card} ${show(0)}`}>
              <Heading title="What are you renting out?" line="Each category asks for its own details." />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <label key={c.slug} className={tile}>
                    <input type="radio" name="category" value={c.slug} checked={category === c.slug} onChange={() => setCategory(c.slug)} className="sr-only" />
                    <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-primary-ink">
                      {CATEGORY_ICONS[c.slug] ?? CATEGORY_ICONS.other}
                    </svg>
                    {c.label}
                  </label>
                ))}
              </div>
              <FieldNote message={errors.category} />
            </section>

            <section className={`${card} ${show(1)}`}>
              <Heading title="Describe your item" />
              <div className="flex flex-col gap-1">
                <TextField label="Title" name="title" required maxLength={MAX_TITLE} placeholder="Camera with 2 lenses" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
                <span className="self-end text-xs text-muted-foreground">
                  {title.length} / {MAX_TITLE}
                </span>
              </div>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                Description
                <textarea name="description" rows={4} maxLength={2000} placeholder="What's included, what it's good for, anything renters should know." className="rounded-input border border-input bg-card px-3.5 py-3 text-base font-normal md:text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
              </label>
              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold">Condition</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CONDITIONS).map(([value, label]) => (
                    <label key={value} className={chip}>
                      <input type="radio" name="condition" value={value} defaultChecked={value === "like_new"} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
                <FieldNote message={errors.condition} />
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="Price per day" name="price" required inputMode="decimal" prefix="N$" placeholder="650" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />
                <TextField label="Deposit" name="deposit" inputMode="decimal" prefix="N$" placeholder="0" error={errors.deposit} />
                <TextField label="Minimum days" name="minDays" inputMode="numeric" defaultValue="1" error={errors.minDays} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex flex-col">
                  <strong className="text-[13px]">How many do you own?</strong>
                  <span className="text-[13px] text-muted-foreground">A hire business can list 300 chairs as one item</span>
                </span>
                <span className="flex items-center gap-2" role="group" aria-label="How many">
                  <button type="button" aria-label="One fewer" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)} className={buttonClasses({ variant: "white", size: "sm", className: "h-11 w-11 px-0 text-lg" })}>
                    −
                  </button>
                  <input name="quantity" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} aria-label="Number owned" className="w-14 rounded-btn-sm border border-input bg-card py-2 text-center font-bold" />
                  <button type="button" aria-label="One more" onClick={() => setQuantity(quantity + 1)} className={buttonClasses({ variant: "white", size: "sm", className: "h-11 w-11 px-0 text-lg" })}>
                    +
                  </button>
                </span>
              </div>
            </section>

            <section className={`${card} ${show(2)}`}>
              <Heading title="Add photos" line="Bright photos get booked faster. Add at least 3." />
              <ListingPhotos photos={photos} onChange={setPhotos} error={errors.photos} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
                  Town
                  <select name="town" defaultValue={defaultTown} className="h-[52px] rounded-input border border-input bg-card px-3.5 text-base font-normal md:text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    {COLLECTION_TOWNS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <TextField label="Area renters collect from" name="area" required placeholder="Klein Windhoek" value={area} onChange={(e) => setArea(e.target.value)} error={errors.area} />
              </div>
              <TextField label="Street address (private)" name="street" autoComplete="street-address" placeholder="12 Nelson Mandela Ave" />
              <p className="-mt-2 text-[13px] text-muted-foreground">Renters only see the area and town. Your street address shows once you accept and pay the booking fee.</p>
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
            <span className="hidden text-xs font-bold tracking-[.06em] text-muted-foreground uppercase lg:block">Preview</span>
            <div className="hidden lg:block">
              <BookingCard
                item={{ title: title || "Your item", category: categoryLabel, area: area || "Your area", price: parseAmount(price) || 0, unit: "day", availability: "Free this weekend", photoUrl: photos[0]?.preview }}
                href="#listing-form"
                saveHref="#listing-form"
              />
            </div>
            <div className="hidden flex-col gap-2 rounded-card border border-primary-border bg-primary-soft p-5 lg:flex">
              <strong className="text-lg">How you get paid</strong>
              <p className="text-sm leading-normal text-foreground-soft">Listing is free. When you accept a booking you pay RentLoop a small booking fee, then collect the rent and deposit straight from the renter.</p>
              <strong className="text-sm text-primary-ink">We only earn when you earn.</strong>
            </div>
            <Button type="submit" name="intent" value="publish" variant="yellow" size="lg" disabled={pending} className="hidden w-full lg:inline-flex">
              {pending ? "Publishing…" : "Publish my listing"}
            </Button>
          </aside>
        </div>
      </div>

      {/* Phones and tablets: one button at the bottom. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-border bg-card px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] lg:hidden">
        {step > 0 && (
          <button type="button" aria-label="Back" onClick={() => setStep(step - 1)} className={buttonClasses({ variant: "white", size: "lg", className: "w-14 flex-none px-0 md:hidden" })}>
            <ArrowLeftIcon size={18} />
          </button>
        )}
        {step < 2 ? (
          <>
            <button type="button" disabled={step === 0 && !done[0]} onClick={() => setStep(step + 1)} className={buttonClasses({ size: "lg", className: "flex-1 md:hidden" })}>
              {step === 0 ? "Continue to details" : "Continue to photos"}
              <ArrowRightIcon />
            </button>
            <Button type="submit" name="intent" value="publish" variant="yellow" size="lg" disabled={pending} className="hidden flex-1 md:inline-flex">
              Publish my listing
            </Button>
          </>
        ) : (
          <Button type="submit" name="intent" value="publish" variant="yellow" size="lg" disabled={pending} className="flex-1">
            {pending ? "Publishing…" : "Publish my listing"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Heading({ title, line }: { title: string; line?: ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold md:text-2xl">{title}</h2>
      {line && <p className="mt-1 text-sm text-muted-foreground">{line}</p>}
    </div>
  );
}

function FieldNote({ message }: { message?: string }) {
  return message ? <p className="text-[13px] font-medium text-danger">{message}</p> : null;
}
