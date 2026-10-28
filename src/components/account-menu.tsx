"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { focusRingClass, focusRingInsetClass } from "@/components/button";
import { ChevronDownIcon } from "@/components/icons";
import { cardClass } from "@/components/ui";
import { ROUTES } from "@/lib/site-links";

const itemClass = `flex min-h-11 w-full items-center px-4 text-left text-[15px] font-semibold text-foreground hover:bg-muted hover:text-primary ${focusRingInsetClass}`;

/**
 * The avatar in the desktop header: opens a small menu with My bookings, the
 * owner dashboard (for people who list) and Sign out. Escape, a click outside
 * or tabbing away closes it.
 */
export function AccountMenu({ name, lists }: { name: string; lists: boolean }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div
      ref={wrap}
      className="relative"
      // Tabbing past the last item closes the menu.
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Your account, ${name}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 rounded-full font-semibold text-foreground ${focusRingClass}`}
      >
        <Avatar name={name} />
        <span className="hidden xl:inline">{name}</span>
        <span className={`text-muted-foreground transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div id={menuId} className={`${cardClass} absolute top-full right-0 z-40 mt-2 w-56 overflow-hidden py-1.5 shadow-md`}>
          <Link href={ROUTES.myBookings} onClick={close} className={itemClass}>
            My bookings
          </Link>
          {lists && (
            <Link href={ROUTES.owner} onClick={close} className={itemClass}>
              Owner dashboard
            </Link>
          )}
          <form action="/auth/signout" method="post" className="mt-1.5 border-t border-border pt-1.5">
            <button className={itemClass}>Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
