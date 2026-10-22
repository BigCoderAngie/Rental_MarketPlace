import Link from "next/link";
import { BottomTabs, TopNav } from "@/components/app-nav";
import { Sidebar } from "@/components/sidebar";
import { focusRingClass, upgradeBadgeClass } from "@/components/ui";
import { isPlatformAdmin } from "@/lib/admin";
import { requireBusiness } from "@/lib/business";
import { loadPlan, planReminder } from "@/lib/plans";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, business } = await requireBusiness();
  const [{ subscription, plans }, isAdmin] = await Promise.all([loadPlan(supabase, business.id), isPlatformAdmin()]);
  const paidPlan = plans.find((p) => p.code === subscription?.plan_code);
  const reminder = planReminder(subscription, paidPlan?.name ?? "");

  // Phones: header and bottom tabs. 640 to 1023px: header and top row.
  // 1024px and up: the sidebar holds the business name, the menu and Sign out.
  return (
    <div className="min-h-screen lg:pl-60">
      <Sidebar businessName={business.name} isAdmin={isAdmin} />
      {/* Phones and tablets: one centred 768px column. Next to the sidebar: a wider, fluid column (docs/DESIGN.md). */}
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col lg:mx-0 lg:max-w-6xl lg:px-4">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <span className="truncate font-semibold">{business.name}</span>
          {/* On phones, Sign out is on the More page. */}
          <form action="/auth/signout" method="post" className="hidden shrink-0 sm:block">
            <button className={`min-h-11 rounded px-2 text-sm text-muted-foreground underline hover:text-foreground ${focusRingClass}`}>
              Sign out
            </button>
          </form>
        </header>
        <TopNav isAdmin={isAdmin} />

        {reminder && (
          <Link
            href="/plan"
            className={`block px-4 py-2 text-sm ${reminder.tone === "warn" ? "bg-accent-soft text-accent-ink" : "bg-muted text-foreground-soft"}`}
          >
            {reminder.text} <span className={upgradeBadgeClass}>See plans</span>
          </Link>
        )}

        {/* On phones, leave room for the tab bar and the iPhone home bar. */}
        <main className="flex-1 px-4 pt-4 pb-[calc(var(--tab-bar-height)+1.5rem+env(safe-area-inset-bottom))] sm:pb-10 lg:pt-8">
          {children}
        </main>

        <BottomTabs />
      </div>
    </div>
  );
}
