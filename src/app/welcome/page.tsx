import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, focusRingClass } from "@/components/button";
import { CheckIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { StoreButtons } from "@/components/store-buttons";
import { firstName } from "@/lib/signup";
import { ROUTES } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "You're in | RentLoop" };

const STEPS = [
  { title: "Pick your item and dates", desktop: "See the price, photos and reviews.", phone: "See the price, photos and reviews." },
  { title: "Send a free request", desktop: "Several people can ask. The owner picks one.", phone: "Several people can ask. The owner picks one." },
  { title: "Get the owner's details and collect", desktop: "Once you are picked, you pay rent and deposit to the owner.", phone: "Once picked, pay rent and deposit to the owner." },
];

// docs/build-kit/reference/desktop/SiteAllSet.html and mobile/SiteAllSet.html,
// shown right after sign-up. The kit's stock portrait on the right is left out
// (MASTER-PLAN build kit decision 14: no stock photos).
export default async function WelcomePage() {
  const { data } = await (await createClient()).auth.getClaims();
  const name = firstName(String(data?.claims?.user_metadata?.full_name ?? ""));

  return (
    <div className="min-h-screen bg-deep text-deep-foreground">
      <main className="wrap flex flex-col gap-5 pt-10 pb-14 md:gap-7 md:pb-[60px]">
        <Link href={ROUTES.home} aria-label="RentLoop home" className={`hidden self-start rounded md:block ${focusRingClass}`}>
          <Logo onDeep className="text-2xl [--mark:40px]" />
        </Link>
        <span aria-hidden className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-accent text-accent-foreground md:mt-10 md:h-24 md:w-24 md:rounded-[28px]">
          <CheckIcon size={40} />
        </span>
        <div>
          <h1 className="text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em] md:text-[60px]">You&apos;re in{name ? `, ${name}` : ""}!</h1>
          <p className="mt-2.5 text-base text-deep-muted md:text-[19px]">Here&apos;s how renting works on RentLoop.</p>
        </div>
        <ol className="flex max-w-[920px] flex-col gap-3 md:flex-row md:flex-wrap md:gap-[18px]">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3.5 rounded-card border border-white/10 bg-deep-2 p-4 md:flex-[1_1_240px] md:flex-col md:gap-2.5 md:rounded-panel md:p-6">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent font-extrabold text-accent-foreground md:h-10 md:w-10">{i + 1}</span>
              <span className="flex flex-col gap-0.5 md:gap-2.5">
                <strong className="text-[15px] md:text-lg">{step.title}</strong>
                <span className="text-sm leading-normal text-deep-muted md:hidden">{step.phone}</span>
                <span className="hidden text-[14.5px] leading-normal text-deep-muted md:block">{step.desktop}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3.5 md:flex-row md:flex-wrap">
          <ButtonLink href={ROUTES.home} variant="yellow" size="lg" className="w-full md:w-auto md:px-[30px]">
            Start exploring
          </ButtonLink>
          <ButtonLink href={ROUTES.listItem} variant="outline" size="lg" className="w-full md:w-auto md:px-[30px]">
            List my first item
          </ButtonLink>
        </div>
        <div className="flex max-w-[920px] flex-col gap-3.5 border-t border-white/15 pt-6 md:mt-3 md:flex-row md:flex-wrap md:items-start">
          <span className="flex flex-col gap-0.5 md:mr-3">
            <strong className="text-base md:text-[17px]">Get the RentLoop app</strong>
            <span className="text-sm text-deep-muted">Get a ping the moment an owner picks you.</span>
          </span>
          <div className="md:hidden">
            <StoreButtons onDeep light stacked />
          </div>
          <div className="hidden md:block">
            <StoreButtons onDeep light />
          </div>
        </div>
      </main>
    </div>
  );
}
