/**
 * Grey bars standing in for a name, phone and address until a booking is
 * paid (docs/build-kit 01-DESIGN-SYSTEM.md "LockedDetails", rule 8).
 */
export function LockedDetails({ note = "Shows once the owner accepts your request.", rows = ["Name", "Phone", "Address"] }: { note?: string; rows?: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-[14px] bg-background px-3 py-3">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-3 text-[13.5px] text-muted-foreground">
            <span className="w-16 flex-none">{row}</span>
            <span aria-hidden className="h-3 max-w-[240px] flex-1 rounded-md bg-lock" />
            <span className="sr-only">hidden</span>
          </div>
        ))}
      </div>
      <p className="text-[13.5px] font-semibold">{note}</p>
    </div>
  );
}

/** The padlock circle beside locked details. */
export function LockIcon() {
  return (
    <span aria-hidden className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-muted text-muted-foreground">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}
