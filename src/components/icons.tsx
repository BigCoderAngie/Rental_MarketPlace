// Small line icons from the build kit references, drawn in the text colour.

export function SearchIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** The kit's `.ck`: a 22px green circle with a white tick. */
export function CheckDot() {
  return (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <CheckIcon />
    </span>
  );
}

/** One line drawn in the text colour, `size` px square, hidden from screen readers. */
function LineIcon({ size, strokeWidth, d }: { size: number; strokeWidth: number; d: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return <LineIcon size={size} strokeWidth={2.25} d="M5 12h14M13 6l6 6-6 6" />;
}

export function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return <LineIcon size={size} strokeWidth={2.25} d="M19 12H5M11 6l-6 6 6 6" />;
}

export function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return <LineIcon size={size} strokeWidth={2.5} d="M6 9l6 6 6-6" />;
}

/** A small filled dot in the text colour, like the one on a LIVE badge. */
export function DotIcon({ size = 6 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 2 2" fill="currentColor" className="shrink-0">
      <circle cx="1" cy="1" r="1" />
    </svg>
  );
}

/** Five filled stars in the star colour. Screen readers get the rating as text beside it. */
export function FiveStars({ size = 14 }: { size?: number }) {
  return (
    <span aria-hidden className="inline-flex gap-px align-[-2px] text-star">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

export function HeartIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />
    </svg>
  );
}
