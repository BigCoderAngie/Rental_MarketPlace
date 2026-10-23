"use client";

import { useRef, type ReactNode } from "react";
import { buttonClasses } from "@/components/button";
import { CloseIcon } from "@/components/icons";

/**
 * Phones: the Filters button and the bottom sheet it opens (build kit
 * 03-PAGES-AND-ROUTES.md §9). A native <dialog> keeps focus inside and closes
 * on Escape or a tap on the dimmed backdrop.
 */
export function FilterSheet({ children, active }: { children: ReactNode; active: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} className={buttonClasses({ variant: "white", className: "h-[50px] flex-none gap-1.5 px-3.5" })}>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
        Filters{active > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{active}</span>}
      </button>
      <dialog
        ref={dialog}
        aria-label="Filters"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="filter-sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-[24px] bg-card p-0 text-foreground backdrop:bg-foreground/40"
      >
        <div className="flex flex-col gap-4 px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-border" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Filters</h2>
            <button type="button" aria-label="Close filters" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-btn-sm border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <CloseIcon />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
