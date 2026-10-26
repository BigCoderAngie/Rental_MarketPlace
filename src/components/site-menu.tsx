"use client";

import Link from "next/link";
import { useRef } from "react";
import { Avatar } from "@/components/avatar";
import { ButtonLink, focusRingClass, focusRingInsetClass } from "@/components/button";
import { Flag } from "@/components/flag";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { CATEGORIES, HEADER_NAV, ROUTES, categoryHref, type Viewer } from "@/lib/site-links";

const iconButton = `flex h-11 w-11 items-center justify-center rounded-btn-sm border border-border bg-card text-foreground ${focusRingClass}`;
const menuLink = `flex min-h-12 items-center border-b border-border text-[15px] font-semibold text-foreground hover:text-primary ${focusRingInsetClass}`;

/**
 * The phone menu: a panel that slides in from the right (the phone references
 * only show the menu button). A native <dialog> keeps keyboard focus inside,
 * closes on Escape, and the backdrop or any link closes it too.
 */
export function SiteMenu({ viewer }: { viewer: Viewer }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" aria-label="Menu" aria-haspopup="dialog" className={iconButton} onClick={() => dialog.current?.showModal()}>
        <MenuIcon />
      </button>

      <dialog
        ref={dialog}
        aria-label="Menu"
        // A click on the dimmed backdrop lands on the dialog itself, outside the panel.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="site-menu fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[86%] max-w-sm overflow-y-auto bg-background p-0 text-foreground backdrop:bg-foreground/40"
      >
        <div className="flex min-h-full flex-col">
          <div className="flex h-[62px] items-center justify-between border-b border-border bg-card px-4">
            <Link href={ROUTES.home} onClick={close} aria-label="RentLoop home" className={`rounded ${focusRingClass}`}>
              <Logo className="text-[19px] [--mark:32px]" />
            </Link>
            <button type="button" aria-label="Close menu" className={iconButton} onClick={close}>
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col gap-5 px-4 py-5">
            {viewer ? (
              <div className="flex flex-col gap-3">
                <Link href={ROUTES.myBookings} onClick={close} className={`flex items-center gap-3 rounded-card ${focusRingClass}`}>
                  <Avatar name={viewer.name} />
                  <span className="flex flex-col">
                    <strong className="text-base">{viewer.name}</strong>
                    <span className="text-[13px] text-muted-foreground">Your bookings</span>
                  </span>
                </Link>
                <ButtonLink href={ROUTES.listItem} onClick={close} className="w-full">
                  List an item
                </ButtonLink>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <ButtonLink href={ROUTES.join} onClick={close} variant="yellow" className="w-full">
                  Sign up free
                </ButtonLink>
                <ButtonLink href={ROUTES.signIn} onClick={close} variant="white" className="w-full">
                  Sign in
                </ButtonLink>
              </div>
            )}

            <form action={ROUTES.explore} role="search" onSubmit={close}>
              <label className="flex h-[50px] items-center gap-2.5 rounded-input border border-input bg-card px-3.5 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                <SearchIcon />
                <span className="sr-only">What do you need?</span>
                {/* 16px so iPhones don't zoom in when it gets focus. */}
                <input type="search" name="q" placeholder="What do you need?" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
              </label>
            </form>

            <nav aria-label="Main">
              {HEADER_NAV.map((link) => (
                <Link key={link.label} href={link.href} onClick={close} className={menuLink}>
                  {link.label}
                </Link>
              ))}
              <a href={ROUTES.getApp} onClick={close} className={menuLink}>
                Get the app
              </a>
            </nav>

            <nav aria-label="Categories">
              <h2 className="pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <ButtonLink key={c.slug} href={categoryHref(c.slug)} onClick={close} variant="white" size="chip">
                    {c.label}
                  </ButtonLink>
                ))}
              </div>
            </nav>

            {viewer && (
              <form action="/auth/signout" method="post">
                <button className={`min-h-11 rounded text-sm font-semibold text-muted-foreground underline hover:text-foreground ${focusRingClass}`}>Sign out</button>
              </form>
            )}
          </div>

          <p className="mt-auto flex items-center gap-2 bg-deep px-4 py-4 text-[13px] font-bold text-accent">
            <Flag width={20} />
            We only earn when you earn.
          </p>
        </div>
      </dialog>
    </>
  );
}
