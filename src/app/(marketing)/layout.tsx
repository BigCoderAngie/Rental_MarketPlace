import Link from "next/link";
import { focusRingClass, secondaryButtonClass } from "@/components/ui";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { createClient } from "@/lib/supabase/server";
import { whatsAppLink } from "@/lib/whatsapp";

// Public pages for signed-out visitors: the homepage, terms and privacy.
// Jump links use "/#..." so they also work from the terms and privacy pages.
const JUMP_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#plans", label: "Plans" },
  { href: "/#faq", label: "FAQ" },
];

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  // Signed-in users only reach terms and privacy here (proxy.ts sends them
  // from the homepage to their calendar), so give them a way back.
  const { data } = await (await createClient()).auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
          <Link href="/" className={`mr-auto text-base font-semibold rounded ${focusRingClass}`}>
            Rental Marketplace
          </Link>
          <nav aria-label="On this page" className="order-last flex w-full gap-5 text-sm sm:order-none sm:w-auto">
            {JUMP_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={`py-1 text-foreground-soft hover:text-foreground rounded ${focusRingClass}`}>
                {l.label}
              </a>
            ))}
          </nav>
          <Link href={signedIn ? "/calendar" : "/login"} className={`${secondaryButtonClass} ${focusRingClass}`}>
            {signedIn ? "Open the app" : "Sign in"}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {SUPPORT_WHATSAPP ? (
              <a
                href={whatsAppLink("Hi, I have a question about Rental Marketplace.", SUPPORT_WHATSAPP)}
                className={`font-medium text-primary underline rounded ${focusRingClass}`}
              >
                WhatsApp us on {SUPPORT_WHATSAPP}
              </a>
            ) : (
              <span>WhatsApp: number coming soon (placeholder)</span>
            )}
          </p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/terms" className={`underline hover:text-foreground rounded ${focusRingClass}`}>
              Terms
            </Link>
            <Link href="/privacy" className={`underline hover:text-foreground rounded ${focusRingClass}`}>
              Privacy
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} Rental Marketplace</p>
        </div>
      </footer>
    </div>
  );
}
