/**
 * "Download on the App Store" / "Get it on Google Play" (docs/build-kit
 * 01-DESIGN-SYSTEM.md "StoreButtons"): dark on light backgrounds and in the desktop
 * footer, white in the phone footer. The apps aren't out yet (Part 0 answer), so these are not links and
 * a "Coming soon" note sits under them.
 */
export function StoreButtons({ onDeep = false, stacked = false }: { onDeep?: boolean; stacked?: boolean }) {
  // Dark buttons, except the white ones in the phone footer.
  const look = stacked
    ? "bg-card text-store [--edge:var(--input)] [--glow:rgba(0,0,0,.1)]"
    : "bg-store text-white [--edge:#000] [--glow:rgba(0,0,0,.25)]";
  const button = `b3 rl-btn h-[54px] cursor-default gap-2.5 rounded-btn px-[18px] ${look}`;
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex gap-2.5 ${stacked ? "flex-col" : "flex-wrap"}`}>
        <span className={button}>
          <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.5-3.8zM14 5.6c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
          </svg>
          <StoreLabel small="Download on the" big="App Store" />
        </span>
        <span className={button}>
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24">
            <path d="M4 3l10 9-10 9z" fill="#34D399" />
            <path d="M4 3l13 7.5-3 1.5z" fill="#60A5FA" />
            <path d="M4 21l13-7.5-3-1.5z" fill="#F87171" />
            <path d="M17 10.5l3 1.5-3 1.5-3-1.5z" fill="#FBBF24" />
          </svg>
          <StoreLabel small="Get it on" big="Google Play" />
        </span>
      </div>
      <p className={`text-xs ${onDeep ? "text-deep-muted" : "text-muted-foreground"}`}>Coming soon</p>
    </div>
  );
}

function StoreLabel({ small, big }: { small: string; big: string }) {
  return (
    <span className="flex flex-col text-left leading-[1.1]">
      <span className="text-[10.5px] font-medium opacity-80">{small}</span>
      <span className="text-base font-bold">{big}</span>
    </span>
  );
}
