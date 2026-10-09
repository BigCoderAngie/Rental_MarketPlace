import Link from "next/link";
import { requireBusiness } from "@/lib/business";

const NAV = [
  { href: "/calendar", label: "Calendar" },
  { href: "/bookings", label: "Bookings" },
  { href: "/quotes", label: "Quotes" },
  { href: "/inventory", label: "Inventory" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { business } = await requireBusiness();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <span className="truncate font-semibold">{business.name}</span>
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/settings" className="text-sm text-zinc-600 underline">Settings</Link>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-zinc-600 underline">Sign out</button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-24">{children}</main>

      {/* Bottom tab bar: thumbs reach it on a phone. */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="block py-3 text-center text-sm font-medium text-zinc-700">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
