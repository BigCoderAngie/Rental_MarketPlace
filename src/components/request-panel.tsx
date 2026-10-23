"use client";

import { usePathname, useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { sendRequest, type SendState } from "@/app/(marketing)/items/[id]/actions";
import { FormMessage } from "@/components/auth-fields";
import { Button, buttonClasses } from "@/components/button";
import { addDays } from "@/lib/dates";
import { formatNadWhole } from "@/lib/money";
import { requestMoney } from "@/lib/requests";

type Props = {
  itemId: string;
  dailyPrice: number;
  deposit: number;
  minDays: number;
  inService: number;
  today: string;
  from: string;
  to: string;
  /** Free units on the chosen dates, from the item's calendar. */
  freeUnits: number | null;
  isMine: boolean;
};

const dateInput = "h-12 w-full rounded-btn-sm border border-input bg-card px-3 text-base text-foreground md:text-[15px] focus:outline-2 focus:outline-offset-2 focus:outline-primary";

/**
 * "Request to book" (SiteItem.html): dates, availability from the calendar,
 * how many, what is paid to the owner at collection, "Booking fee for you
 * N$0", the note that others may ask too, and Send request. Desktop: a sticky
 * card. Phones: the "Your dates" card and a bar pinned to the bottom. Changing
 * a date reloads the page so availability is checked again. No message box
 * (build kit decision 12).
 */
export function RequestPanel(props: Props) {
  const { itemId, dailyPrice, deposit, minDays, inService, today, from, to, freeUnits, isMine } = props;
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState<SendState, FormData>(sendRequest, {});
  const money = requestMoney(dailyPrice, deposit, from, to, quantity);
  const tooShort = money.days < minDays;
  const free = freeUnits !== null && freeUnits >= quantity;
  const maxQuantity = Math.max(1, Math.min(inService, freeUnits ?? inService));

  function changeDates(nextFrom: string, nextTo: string) {
    if (!nextFrom) return;
    const end = !nextTo || nextTo < nextFrom ? addDays(nextFrom, Math.max(minDays, 1) - 1) : nextTo;
    router.replace(`${pathname}?${new URLSearchParams({ from: nextFrom, to: end })}`, { scroll: false });
  }

  const availability = tooShort ? (
    <span className="text-[13.5px] font-semibold text-accent-ink">Rents for at least {minDays} days</span>
  ) : free ? (
    <span className="text-[13.5px] font-semibold text-primary">✓ Free on these dates</span>
  ) : (
    <span className="text-[13.5px] font-semibold text-danger">Not free on these dates</span>
  );

  return (
    <form id="request-form" action={formAction} className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 md:p-[22px] lg:sticky lg:top-24 lg:shadow-[0_16px_40px_rgba(20,40,30,.08)]">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="quantity" value={quantity} />
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold md:text-[22px]">
          <span className="lg:hidden">Your dates</span>
          <span className="hidden lg:inline">Request to book</span>
        </h2>
        <span className="rounded-full bg-primary-soft px-2.5 py-[3px] text-xs font-bold text-primary-ink">Free to send</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Pick up
          <input type="date" name="from" min={today} value={from} onChange={(e) => changeDates(e.target.value, to)} className={dateInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Return
          <input type="date" name="to" min={from} value={to} onChange={(e) => changeDates(from, e.target.value)} className={dateInput} />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        {availability}
        {inService > 1 && (
          <div className="flex items-center gap-2" role="group" aria-label="How many">
            <button type="button" aria-label="One fewer" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)} className={buttonClasses({ variant: "white", size: "sm", className: "h-11 w-11 px-0 text-lg" })}>
              −
            </button>
            <span className="w-6 text-center font-bold" aria-live="polite">
              {quantity}
            </span>
            <button type="button" aria-label="One more" disabled={quantity >= maxQuantity} onClick={() => setQuantity(quantity + 1)} className={buttonClasses({ variant: "white", size: "sm", className: "h-11 w-11 px-0 text-lg" })}>
              +
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 rounded-[14px] border border-border px-3.5 py-3 text-sm">
        <span className="pb-1 text-[11.5px] font-bold tracking-[.06em] text-muted-foreground uppercase">Pay the owner at collection</span>
        <div className="flex justify-between py-1">
          <span className="text-foreground-soft">
            {formatNadWhole(dailyPrice)} × {money.days} day{money.days === 1 ? "" : "s"}
            {quantity > 1 && ` × ${quantity}`}
          </span>
          <span>{formatNadWhole(money.rent)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-foreground-soft">Deposit, returned after</span>
          <span>{formatNadWhole(money.deposit)}</span>
        </div>
      </div>
      <div className="flex justify-between text-[15px] font-bold text-primary">
        <span>Booking fee for you</span>
        <span>N$0</span>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-lg font-extrabold md:text-xl">
        <span>You pay the owner</span>
        <span>{formatNadWhole(money.payOwner)}</span>
      </div>

      <p className="rounded-[14px] border border-accent-border bg-accent-soft px-3.5 py-3 text-[13.5px] leading-normal text-accent-ink">
        Others may ask for the same dates. When the owner picks you, you both see each other&apos;s name and number. Requests wait 24 hours for the owner.
      </p>

      <FormMessage message={state.message} />

      {isMine ? (
        <p className="text-center text-sm font-semibold text-muted-foreground">This is your item.</p>
      ) : (
        <Button type="submit" size="lg" disabled={pending || !free || tooShort} className="hidden w-full lg:inline-flex">
          {pending ? "Sending…" : "Send request"}
        </Button>
      )}

      {/* Phones: price and Send request pinned to the bottom. */}
      {!isMine && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(20,40,30,.08)] lg:hidden">
          <span className="flex flex-col">
            <span className="text-base font-extrabold">
              {formatNadWhole(dailyPrice)} <small className="text-xs font-medium text-muted-foreground">/ day</small>
            </span>
            <span className="text-xs text-muted-foreground">Free to request</span>
          </span>
          <Button type="submit" size="lg" disabled={pending || !free || tooShort} className="flex-1">
            {pending ? "Sending…" : "Send request"}
          </Button>
        </div>
      )}
    </form>
  );
}
