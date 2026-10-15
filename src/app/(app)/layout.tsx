import Link from "next/link";
import { requireBusiness } from "@/lib/business";
import { loadPlan, planReminder } from "@/lib/plans";

const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/bookings", label: "Bookings" },
  { href: "/quotes", label: "Quotes" },
  { href: "/customers", label: "Customers" },
  { href: "/inventory", label: "Inventory" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, business } = await requireBusiness();
  const [{ subscription, plans }, { data: isAdmin }] = await Promise.all([
    loadPlan(supabase, business.id),
    supabase.rpc("is_platform_admin"),
  ]);
  const paidPlan = plans.find((p) => p.code === subscription?.plan_code);
  const reminder = planReminder(subscription, paidPlan?.name ?? "");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <span className="truncate font-semibold">{business.name}</span>
        <div className="flex shrink-0 items-center gap-4">
          {isAdmin && <Link href="/admin" className="text-sm text-muted underline">Admin</Link>}
          <Link href="/reports" className="text-sm text-muted underline">Reports</Link>
          <Link href="/settings" className="text-sm text-muted underline">Settings</Link>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-muted underline">Sign out</button>
          </form>
        </div>
      </header>

      {reminder && (
        <Link
          href="/plan"
          className={`block px-4 py-2 text-sm ${reminder.tone === "warn" ? "bg-gold-soft text-gold-ink" : "bg-subtle text-ink-soft"}`}
        >
          {reminder.text} <span className="font-semibold underline">See plans</span>
        </Link>
      )}

      <main className="flex-1 px-4 pt-4 pb-24">{children}</main>

      {/* Bottom tab bar: thumbs reach it on a phone. */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="block py-3 text-center text-xs font-medium text-ink-soft sm:text-sm">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
