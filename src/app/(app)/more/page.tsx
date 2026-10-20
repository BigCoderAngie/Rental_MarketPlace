import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, focusRingInsetClass } from "@/components/ui";
import { isPlatformAdmin } from "@/lib/admin";
import { moreLinks } from "@/lib/nav";

export const metadata: Metadata = { title: "More | RentLoop" };

const rowClass = `flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium hover:bg-muted ${focusRingInsetClass}`;

/** The "More" tab on phones: everything that doesn't fit in the bottom tab bar. */
export default async function MorePage() {
  const links = moreLinks(await isPlatformAdmin());

  return (
    <>
      <PageHeader title="More" />
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={rowClass}>
              {l.label}
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>

      <form action="/auth/signout" method="post" className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <button className={rowClass}>Sign out</button>
      </form>
    </>
  );
}

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted-foreground" fill="none">
      <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
