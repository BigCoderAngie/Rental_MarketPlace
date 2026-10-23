import { useId } from "react";

/**
 * The RentLoop logo from the build kit (public/brand/rentloop-logo.svg): green
 * tile, yellow arrows, white R, a top light and a thin top highlight. Flat: no
 * bottom edge, no drop shadow. Drawn inline so the R uses the page's Inter.
 * Sizes in use: 32 (phone header), 36 (footer), 38 (desktop header), 46 (sign in).
 */
export function LogoMark({ size, className = "" }: { size?: number; className?: string }) {
  // useId can contain characters that break url(#...) in some browsers.
  const id = `rl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const light = `${id}-light`;
  const edge = `${id}-edge`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className={`block shrink-0 ${className}`}>
      <defs>
        <linearGradient id={light} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".08" />
        </linearGradient>
        <linearGradient id={edge} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset=".12" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="23" fill="#00743F" />
      <rect width="100" height="100" rx="23" fill={`url(#${light})`} />
      <g fill="none" stroke="#FFC83D" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.8 39.7A30 30 0 0 1 78.2 39.7" />
        <path d="M81.1 30.1L78.2 39.7L69.9 34.3" />
        <path d="M78.2 60.3A30 30 0 0 1 21.8 60.3" />
        <path d="M18.9 69.9L21.8 60.3L30.1 65.7" />
      </g>
      <text x="50" y="63" textAnchor="middle" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }} fontSize="36" fontWeight="800" fill="#fff">
        R
      </text>
      <rect x="1" y="1" width="98" height="98" rx="22" fill="none" stroke={`url(#${edge})`} strokeWidth="2" />
    </svg>
  );
}

/**
 * The brand lockup: the logo plus "RentLoop" in Inter 800, mint-text green on
 * light backgrounds and white on deep green. Set the wordmark size in `className`
 * and the exact mark size with --mark (it defaults to 1.65 times the text), as
 * in the kit: 19px text and 32px mark on phones, 22/36 in the footer, 23/38 on desktop.
 */
export function Logo({ onDeep = false, className = "text-[23px]" }: { onDeep?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.45em] font-extrabold tracking-tight ${onDeep ? "text-deep-foreground" : "text-primary-ink"} ${className}`}>
      <LogoMark className="h-[var(--mark,1.65em)] w-[var(--mark,1.65em)]" />
      RentLoop
    </span>
  );
}
