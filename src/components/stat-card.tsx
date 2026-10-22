import Link from "next/link";
import type { ReactNode } from "react";
import { cardClass, cardLinkClass, focusRingClass } from "@/components/ui";

export type StatTone = "primary" | "danger" | "quiet";

const TONE_CLASS: Record<StatTone, string> = {
  primary: "text-primary", // 5.9:1 on white
  danger: "text-danger", // 5.3:1 on white
  quiet: "text-muted-foreground", // 5.9:1 on white
};

/**
 * A number with its label (docs/DESIGN.md "Stat card"). `note` sits under the
 * number (for example "(1 late)"), `caption` under the label (for example a
 * N$ total). With `href` the whole card is one link.
 */
export function StatCard({
  label,
  value,
  tone = "primary",
  note,
  caption,
  href,
}: {
  label: string;
  value: ReactNode;
  tone?: StatTone;
  note?: ReactNode;
  caption?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className={`block text-[28px] font-semibold leading-8 ${TONE_CLASS[tone]}`}>{value}</span>
      {note != null && note !== false && <span className="mt-1 block text-sm font-medium text-danger">{note}</span>}
      <span className="mt-2 block text-sm font-medium text-foreground">{label}</span>
      {caption != null && caption !== false && <span className="block text-sm text-muted-foreground">{caption}</span>}
    </>
  );
  const layout = "flex h-full min-h-24 flex-col p-4";
  return href ? (
    <Link href={href} className={`${cardLinkClass} ${layout} ${focusRingClass}`}>
      {body}
    </Link>
  ) : (
    <div className={`${cardClass} ${layout}`}>{body}</div>
  );
}
