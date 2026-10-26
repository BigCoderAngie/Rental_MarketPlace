/**
 * Marks sample content that stands in until real data exists (MASTER-PLAN
 * decision 11), so nobody mistakes it for a real listing, person or result.
 */
export function SampleTag({ onDeep = false, children = "Sample" }: { onDeep?: boolean; children?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-dashed px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
        onDeep ? "border-white/40 text-deep-muted" : "border-input bg-card text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}
