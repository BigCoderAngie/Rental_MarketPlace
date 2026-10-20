/**
 * Numbered steps joined by a line (docs/DESIGN.md "Step indicator"). Done and
 * current steps are filled green. Desktop shows every label; phones show the
 * circles plus "Step 2 of 4: Photos". `current` counts from 1.
 */
export function StepIndicator({ steps, current: asked }: { steps: string[]; current: number }) {
  // Keep the step in range, so a bad value never shows "Step 0 of 4".
  const current = Math.min(Math.max(Math.round(asked) || 1, 1), steps.length);
  return (
    <div className="mb-6">
      <ol aria-label="Progress" className="flex items-center">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const now = n === current;
          return (
            <li key={i} className={`flex items-center ${n < steps.length ? "flex-1" : ""}`}>
              <span aria-current={now ? "step" : undefined} className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done || now
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-card text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    n
                  )}
                  <span className="sr-only">{done ? `${label}, done` : now ? `${label}, current step` : label}</span>
                </span>
                <span
                  aria-hidden
                  className={`hidden whitespace-nowrap text-sm sm:inline ${now ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </span>
              {n < steps.length && (
                <span aria-hidden className={`mx-2 h-0.5 flex-1 rounded-full sm:mx-3 ${done ? "bg-primary" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
      <p aria-hidden className="mt-3 text-sm text-muted-foreground sm:hidden">
        Step {current} of {steps.length}: <span className="font-semibold text-foreground">{steps.at(current - 1)}</span>
      </p>
    </div>
  );
}
