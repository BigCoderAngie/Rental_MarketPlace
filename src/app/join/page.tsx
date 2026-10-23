import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LineIcon } from "@/components/auth-fields";
import { ButtonLink, focusRingClass } from "@/components/button";
import { Flag } from "@/components/flag";
import { CheckDot } from "@/components/icons";
import { Logo } from "@/components/logo";
import { FaqLink } from "@/components/signup-pages";
import { safeNextPath } from "@/lib/signup";
import { signupHref } from "@/lib/signup-start";
import { ROUTES } from "@/lib/site-links";

export const metadata: Metadata = { title: "Join RentLoop" };

// docs/build-kit/reference/desktop/SiteJoin.html and mobile/SiteJoin.html:
// "Sign up free" lands here and picks one of the two sign-up paths.
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  // Where to go after sign-up, for example the item a visitor wanted to request (build kit rule 20).
  const next = safeNextPath(String((await searchParams).next ?? ""));
  const withNext = (href: string) => (next ? `${href}?${new URLSearchParams({ next })}` : href);
  // Both cards open the same sign-up; the card only picks where it starts.

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-[60px] items-center gap-1.5 border-b border-border bg-card pr-2 pl-1 md:hidden">
        <Link href={ROUTES.home} aria-label="Back" className={`flex h-11 w-11 items-center justify-center rounded text-foreground ${focusRingClass}`}>
          <LineIcon>
            <path d="M15 18l-6-6 6-6" />
          </LineIcon>
        </Link>
        <strong className="text-[17px]">Join RentLoop</strong>
      </header>

      <div className="mx-auto w-full max-w-[1040px] px-4 pb-14 md:px-8">
        <header className="hidden items-center justify-between py-6 md:flex">
          <Link href={ROUTES.home} aria-label="RentLoop home" className={`rounded ${focusRingClass}`}>
            <Logo className="text-[23px] [--mark:38px]" />
          </Link>
          <span className="text-[14.5px] text-muted-foreground">
            <FaqLink />
          </span>
        </header>

        <div className="mt-5 mb-4 flex flex-col gap-1.5 md:mt-3 md:mb-9 md:items-center md:gap-3 md:text-center">
          <h1 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.02em] md:text-[44px]">
            <span className="md:hidden">How do you want to start?</span>
            <span className="hidden md:inline">Join RentLoop</span>
          </h1>
          <span className="flex items-center gap-2.5 text-[13.5px] text-foreground-soft md:text-[17px]">
            <Flag width={22} />
            <span className="hidden md:inline">How do you want to start?</span>
            <strong className="text-primary">We only earn when you earn.</strong>
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-stretch md:gap-6">
          <PathCard
            tone="green"
            caption="For renters"
            title="I want to rent"
            icon={<LineIcon size={24}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></LineIcon>}
            points={["Send free requests, no fees for renters", "See photos, prices and reviews first", "Pay the owner directly when you collect"]}
            href={signupHref(ROUTES.renterSignUp, "rent", next)}
            action="Sign up to rent →"
          />
          <PathCard
            tone="yellow"
            caption="For owners and hire businesses"
            title="I want to earn"
            icon={<LineIcon size={24}><path d="M12 5v14M5 12h14" /></LineIcon>}
            points={["N$0 to list, you set the price", "Approve every booking yourself", "Pay a small booking fee only when you accept a renter"]}
            href={signupHref(ROUTES.renterSignUp, "earn", next)}
            action="Sign up to list →"
          />
        </div>

        <p className="mt-5 text-center text-[15px] md:mt-7">
          One account does both.<span className="hidden md:inline"> You can rent and list later. ·</span>
          <br className="md:hidden" /> Already have an account?{" "}
          <Link href={withNext(ROUTES.signIn)} className="font-bold text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function PathCard({
  tone,
  caption,
  title,
  icon,
  points,
  href,
  action,
}: {
  tone: "green" | "yellow";
  caption: string;
  title: string;
  icon: ReactNode;
  points: string[];
  href: string;
  action: string;
}) {
  const green = tone === "green";
  return (
    <section className={`flex flex-col gap-3.5 rounded-card border-2 bg-card p-5 md:flex-[1_1_380px] md:gap-[18px] md:p-8 ${green ? "border-primary-border" : "border-accent"}`}>
      <div className="flex items-center gap-3.5 md:flex-col md:items-start md:gap-[18px]">
        <span
          aria-hidden
          className={`flex h-[52px] w-[52px] flex-none items-center justify-center rounded-btn md:h-[60px] md:w-[60px] md:rounded-card ${green ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}
        >
          {icon}
        </span>
        <span className="flex flex-col gap-0.5 md:gap-2.5">
          <span className="text-[11.5px] font-bold tracking-[.06em] text-primary uppercase">{caption}</span>
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em] md:text-[28px]">{title}</h2>
        </span>
      </div>
      <ul className="flex flex-col gap-2.5 md:gap-3">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm">
            <CheckDot />
            {p}
          </li>
        ))}
      </ul>
      <ButtonLink href={href} variant={green ? "green" : "yellow"} size="lg" className="mt-auto w-full">
        {action}
      </ButtonLink>
    </section>
  );
}
