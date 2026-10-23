import Link from "next/link";
import { ButtonLink, focusRingClass } from "@/components/button";
import { HeartIcon } from "@/components/icons";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { formatNadWhole } from "@/lib/money";
import type { ListingCardData } from "@/lib/types";

/**
 * The Amazon-style listing card (docs/build-kit 01-DESIGN-SYSTEM.md
 * "BookingCard"): 4:3 photo with a save button and an optional dark badge,
 * category · area, a two-line title, stars, a big price, the green
 * availability line and a full-width yellow Request to book pill. The whole
 * card lifts on hover. `href` is the item page; `requestHref` is where Request to
 * book goes (the item page, or sign-up first for visitors); `saveHref` is the heart.
 */
export function BookingCard({ item, href, requestHref = href, saveHref }: { item: ListingCardData; href: string; requestHref?: string; saveHref: string }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-card transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(20,40,30,.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage; next/image would need its domain set up
          <img src={item.photoUrl} alt="" className="block aspect-[4/3] w-full bg-border object-cover" />
        ) : (
          <ImagePlaceholder alt="" radius="0" />
        )}
        {item.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-deep px-2.5 py-1 text-[11.5px] font-bold text-deep-foreground">{item.badge}</span>
        )}
      </Link>
      <Link
        href={saveHref}
        aria-label={`Save ${item.title}`}
        className={`absolute top-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-[0_2px_8px_rgba(0,0,0,.18)] ${focusRingClass}`}
      >
        <HeartIcon />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3.5 pb-4">
        <span className="text-[11px] font-bold tracking-[.06em] text-primary-ink uppercase">
          {item.category} · {item.area}
        </span>
        <Link
          href={href}
          className={`line-clamp-2 min-h-[42px] rounded text-base leading-[1.3] font-bold text-foreground hover:text-primary ${focusRingClass}`}
        >
          {item.title}
        </Link>
        {item.rating !== undefined ? (
          <span className="text-[13.5px]">
            <span aria-hidden className="tracking-[1px] text-star">
              ★★★★★
            </span>{" "}
            <strong>{item.rating.toFixed(1)}</strong> <span className="text-muted-foreground">({item.reviews})</span>
            <span className="sr-only"> stars from {item.reviews} reviews</span>
          </span>
        ) : (
          <span className="text-[13.5px] text-muted-foreground">New on RentLoop</span>
        )}
        <span className="text-[26px] leading-none font-extrabold tracking-[-0.02em]">
          {formatNadWhole(item.price)} <small className="text-sm font-medium tracking-normal text-muted-foreground">/ {item.unit}</small>
        </span>
        {item.availableNow === false ? (
          <span className="text-[13.5px] font-semibold text-muted-foreground">{item.availability}</span>
        ) : (
          <span className="text-[13.5px] font-semibold text-primary">✓ {item.availability}</span>
        )}
        <span className="text-[13px] text-muted-foreground">Free to request · pay the owner at collection</span>
        <div className="mt-auto pt-2.5">
          <ButtonLink href={requestHref} variant="yellow" size="cta">
            Request to book
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
