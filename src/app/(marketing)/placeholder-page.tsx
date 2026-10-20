import Link from "next/link";
import { SUPPORT_WHATSAPP } from "@/lib/contact";

/** Stand-in for the terms and privacy pages until their real text is written. */
export function PlaceholderPage({ title, topic }: { title: string; topic: string }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-foreground-soft">
        We are still writing {topic}. Until it is ready, ask us anything on WhatsApp
        {SUPPORT_WHATSAPP ? ` on ${SUPPORT_WHATSAPP}` : " (number coming soon)"}.
      </p>
      <p className="mt-4 text-foreground-soft">
        In short: your customers pay you directly and we never hold rental money. Each business only sees its own data.
      </p>
      <Link href="/" className="mt-8 inline-block font-medium text-primary underline">
        Back to the homepage
      </Link>
    </section>
  );
}
