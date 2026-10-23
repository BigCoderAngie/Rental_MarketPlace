import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/button";
import { CategoryBar } from "@/components/category-bar";
import { Flag } from "@/components/flag";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { Logo, LogoMark } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { StoreButtons } from "@/components/store-buttons";
import { TopStrip } from "@/components/top-strip";

export const metadata: Metadata = { title: "Styleguide | RentLoop", robots: { index: false } };

// Build kit check page: every button, the logo, the flag, colours and type
// (Part 1), and the shell signed out and signed in (Part 2).
// Only on your computer: the live site answers 404.

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
  { variant: "green", label: "Search" },
  { variant: "yellow", label: "Sign up free" },
  { variant: "white", label: "Sign in" },
  { variant: "mint", label: "View booking" },
  { variant: "outline", label: "Set up a hire business" },
];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];
const STATES = [
  { name: "Resting", attrs: {} },
  { name: "Hover", attrs: { "data-hover": "" } },
  { name: "Pressed", attrs: { "data-pressed": "" } },
];

const COLOURS: [string, string, string][] = [
  ["primary (green)", "#00743F", "bg-primary"],
  ["primary-strong (green hover)", "#005C32", "bg-primary-strong"],
  ["primary-edge (green edge)", "#00502B", "bg-primary-edge"],
  ["deep", "#06402F", "bg-deep"],
  ["deep-2", "#0B5A3E", "bg-deep-2"],
  ["accent (yellow)", "#FFC83D", "bg-accent"],
  ["accent-edge (yellow edge)", "#D9A11F", "bg-accent-edge"],
  ["primary-soft (mint)", "#E3F1E8", "bg-primary-soft"],
  ["primary-border (mint line)", "#B8DCC6", "bg-primary-border"],
  ["primary-ink (mint text)", "#0B4D2C", "bg-primary-ink"],
  ["deep-muted (on deep)", "#CFE3D8", "bg-deep-muted"],
  ["on-deep-2", "#9FE0B8", "bg-on-deep-2"],
  ["background (cream)", "#F6F2EA", "bg-background"],
  ["foreground (ink)", "#1A2420", "bg-foreground"],
  ["foreground-soft (ink 2)", "#34403A", "bg-foreground-soft"],
  ["muted-foreground", "#5B6670", "bg-muted-foreground"],
  ["border (line)", "#E6E0D4", "bg-border"],
  ["input (line strong)", "#CDC5B5", "bg-input"],
  ["lock", "#DDD5C6", "bg-lock"],
  ["star", "#E8A317", "bg-star"],
  ["danger (red)", "#B7472A", "bg-danger"],
  ["accent-soft (warn)", "#FFF8E6", "bg-accent-soft"],
  ["info-soft", "#E8F0FA", "bg-info-soft"],
];

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="wrap flex flex-col gap-14 py-12">
      <header>
        <Logo />
        <h1 className="mt-6 text-[44px] font-extrabold leading-none tracking-[-0.02em]">Styleguide</h1>
        <p className="mt-2 text-muted-foreground">
          Build kit Part 1. Compare with docs/build-kit/reference/desktop/SiteHome.html. Only visible on your computer.
        </p>
      </header>

      <Block title="Buttons">
        {STATES.map((state) => (
          <div key={state.name} className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground-soft">{state.name}</h3>
            {VARIANTS.map(({ variant, label }) => (
              <div
                key={variant}
                className={`flex flex-wrap items-center gap-4 rounded-panel p-4 ${variant === "outline" ? "bg-deep" : ""}`}
              >
                {SIZES.map((size) => (
                  <Button key={size} variant={variant} size={size} {...state.attrs}>
                    {label}
                  </Button>
                ))}
                <span className={`text-xs ${variant === "outline" ? "text-deep-muted" : "text-muted-foreground"}`}>
                  {variant}: sm 40, md 48, lg 56
                </span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-foreground-soft">Chips and card button</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="green" size="chip">
              All
            </Button>
            {["Bakkie hire", "Cameras", "Wedding marquees"].map((c) => (
              <Button key={c} variant="white" size="chip">
                {c}
              </Button>
            ))}
            <Button variant="white" size="chip" data-pressed="">
              Pressed chip
            </Button>
          </div>
          <div className="w-72 rounded-card border border-border bg-card p-4">
            <Button variant="yellow" size="cta">
              Request to book
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="green" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </Block>

      <Block title="Logo">
        <div className="flex flex-wrap items-end gap-8">
          {[32, 38, 46].map((s) => (
            <figure key={s} className="flex flex-col items-center gap-2">
              <LogoMark size={s} />
              <figcaption className="text-xs text-muted-foreground">{s}px</figcaption>
            </figure>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <Logo className="text-[19px]" />
          <Logo />
          <span className="rounded-panel bg-deep p-4">
            <Logo onDeep className="text-[22px]" />
          </span>
        </div>
      </Block>

      <Block title="Flag">
        <div className="flex items-center gap-6">
          {[18, 22, 26].map((w) => (
            <span key={w} className="flex items-center gap-2 text-sm">
              <Flag width={w} /> {w}px
            </span>
          ))}
          <span className="flex items-center gap-2 rounded-full bg-deep px-3 py-1.5 text-sm font-bold text-accent">
            <Flag width={22} /> We only earn when you earn.
          </span>
        </div>
      </Block>

      <Block title="Photo placeholder">
        <div className="grid max-w-3xl grid-cols-2 gap-4">
          <ImagePlaceholder />
          <ImagePlaceholder aspect="16 / 9" radius="var(--radius-panel)" />
        </div>
      </Block>

      <Block title="Colours">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLOURS.map(([name, hex, cls]) => (
            <li key={name} className="flex items-center gap-3 rounded-card border border-border bg-card p-3">
              <span className={`h-10 w-10 shrink-0 rounded-btn-sm border border-border ${cls}`} />
              <span className="text-sm">
                <strong className="block">{name}</strong>
                <span className="text-muted-foreground">{hex}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Type (Inter)">
        <div className="rounded-hero bg-deep p-8 text-deep-foreground">
          <p className="text-[42px] font-extrabold leading-none tracking-[-0.035em] md:text-[66px]">
            Why buy it?
            <br />
            <span className="text-accent">Rent it nearby.</span>
          </p>
          <p className="mt-3 text-xs text-deep-muted">Hero 66px desktop, 42px phone, 800, line-height 1, -0.035em</p>
        </div>
        <p className="text-[44px] font-extrabold tracking-[-0.02em]">Page title 40–44px, 800</p>
        <p className="text-[21px] font-extrabold tracking-[-0.01em] md:text-[22px]">Section title 22px desktop, 21px phone, 800</p>
        <p className="text-[15px]">Body 14–17px. Rent tents, tools and cameras from people near you.</p>
        <p className="text-[13px] text-muted-foreground">Muted 13–14px. Klein Windhoek, Windhoek</p>
        <p className="text-[11px] font-bold uppercase tracking-[.06em] text-primary-ink">Category kicker 11px</p>
      </Block>

      <Block title="Shell (Part 2)">
        <p className="text-sm text-muted-foreground">
          The real pages show these at the top. Below 768px the phone header and menu button show instead.
        </p>
        <ShellDemo label="Signed out">
          <TopStrip />
          <SiteHeader viewer={null} />
        </ShellDemo>
        <ShellDemo label="Signed in, on Explore, Electronics picked">
          <TopStrip />
          <SiteHeader viewer={{ name: "Tangeni" }} current="/explore" />
          <CategoryBar current="electronics" />
        </ShellDemo>
        <div className="flex flex-wrap gap-8">
          <StoreButtons />
          <div className="rounded-panel bg-deep p-4">
            <StoreButtons onDeep stacked />
          </div>
        </div>
      </Block>
    </main>
  );
}

function ShellDemo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-foreground-soft">{label}</h3>
      {/* The header is sticky; overflow-hidden keeps it inside this box. */}
      <div className="overflow-hidden rounded-panel border border-border">{children}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="border-b border-border pb-2 text-[22px] font-extrabold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}
