import Link from "next/link";
import type { ReactNode } from "react";
import { focusRingClass } from "@/components/button";
import { Flag } from "@/components/flag";
import { CheckIcon } from "@/components/icons";
import { Logo } from "@/components/logo";

/**
 * The page around both sign-up paths (docs/build-kit/reference/desktop/SiteSignUp.html
 * and mobile/SiteSignUp.html). Desktop: logo bar, centred title, the step card
 * and the form card. Phones: a sticky header with a back arrow and "Step n of
 * 2", two progress bars, and the section title as the page heading; the
 * form's buttons stick to the bottom (StickyActions).
 */
export function SignupFrame({
  title,
  subtitle,
  pill,
  headerRight,
  phoneTitle,
  backHref,
  step,
  steps,
  sectionTitle,
  sectionIcon,
  children,
  below,
}: {
  title: string;
  subtitle: ReactNode;
  pill?: string;
  headerRight: ReactNode;
  phoneTitle: string;
  backHref: string;
  step: 1 | 2;
  steps: [string, string];
  sectionTitle: string;
  sectionIcon: ReactNode;
  children: ReactNode;
  /** Desktop only, under the form card. */
  below?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Phones */}
      <header className="sticky top-0 z-10 flex h-[60px] items-center gap-1.5 border-b border-border bg-card pr-2 pl-1 md:hidden">
        <Link href={backHref} aria-label="Back" className={`flex h-11 w-11 items-center justify-center rounded text-foreground ${focusRingClass}`}>
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <strong className="flex-1 text-[17px]">{phoneTitle}</strong>
        <span className="mr-2 text-[13px] text-muted-foreground">
          Step {step} of {steps.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-[960px] px-4 pb-[130px] md:px-8 md:pb-14">
        {/* Desktop */}
        <header className="hidden items-center justify-between py-6 md:flex">
          <Link href="/" aria-label="RentLoop home" className={`rounded ${focusRingClass}`}>
            <Logo className="text-[23px] [--mark:38px]" />
          </Link>
          <span className="text-[14.5px] text-muted-foreground">{headerRight}</span>
        </header>
        <div className="mt-2 mb-7 hidden flex-col items-center gap-2.5 text-center md:flex">
          {pill && <span className="rounded-full bg-accent px-2.5 py-[3px] text-xs font-bold text-accent-foreground">{pill}</span>}
          <h1 className="text-[40px] font-extrabold tracking-[-0.02em]">{title}</h1>
          <span className="flex items-center gap-2.5 text-base text-foreground-soft">
            <Flag width={24} />
            <span>{subtitle}</span>
          </span>
        </div>

        <div className="flex flex-col gap-[18px] pt-[18px] md:gap-5 md:pt-0">
          <Stepper step={step} steps={steps} />
          <section className="flex flex-col gap-[18px] md:gap-[22px] md:rounded-card md:border md:border-border md:bg-card md:p-8">
            <h1 className="mt-1 text-[26px] font-extrabold md:hidden">{sectionTitle}</h1>
            <h2 className="hidden items-center gap-2.5 border-b border-border pb-4 text-xl font-extrabold md:flex">
              <span className="text-primary">{sectionIcon}</span>
              {sectionTitle}
            </h2>
            {children}
          </section>
          {below && <div className="hidden md:block">{below}</div>}
        </div>
      </div>
    </div>
  );
}

/** Desktop: two numbered dots on a line (done = green tick). Phones: two bars with "1 · Account" labels. */
function Stepper({ step, steps }: { step: 1 | 2; steps: [string, string] }) {
  return (
    <>
      <div className="flex flex-col gap-2.5 md:hidden" aria-label={`Step ${step} of ${steps.length}`} role="group">
        <div aria-hidden className="flex items-center gap-2.5">
          {steps.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-[3px] ${i < step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <div className="flex justify-between text-[12.5px] font-bold">
          {steps.map((s, i) => (
            <span key={s} className={i + 1 === step ? "text-primary" : "text-muted-foreground"}>
              {i + 1} · {s}
            </span>
          ))}
        </div>
      </div>

      <ol className="relative hidden justify-around rounded-card border border-border bg-card px-8 py-[26px] md:flex">
        {/* The line fills a quarter on step 1 and half on step 2, as in the kit. */}
        <span
          aria-hidden
          className="absolute top-[46px] right-8 left-8 h-[3px] rounded-sm"
          style={{ background: `linear-gradient(90deg, var(--primary) ${step * 25}%, var(--border) ${step * 25}%)` }}
        />
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={s} aria-current={current ? "step" : undefined} className="relative flex flex-col items-center gap-2 bg-card px-4">
              <span
                className={`box-border flex h-10 w-10 items-center justify-center rounded-full border-2 font-extrabold ${
                  done || current ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground"
                }`}
              >
                {done ? <CheckIcon size={16} /> : n}
                {done && <span className="sr-only">done</span>}
              </span>
              <span className={`text-[13px] ${current ? "font-bold text-primary" : "font-semibold text-muted-foreground"}`}>{s}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/**
 * The form's buttons: in the card on desktop (back on the left, main action on
 * the right), pinned to the bottom of the screen on phones.
 */
export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-[calc(26px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(20,40,30,.08)] md:static md:z-auto md:mt-1.5 md:justify-between md:border-0 md:bg-transparent md:p-0 md:shadow-none">
      {children}
    </div>
  );
}
