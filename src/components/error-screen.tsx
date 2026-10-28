import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/button";
import { Logo } from "@/components/logo";
import { cardClass } from "@/components/ui";
import { SUPPORT_WHATSAPP } from "@/lib/contact";
import { whatsAppLink } from "@/lib/whatsapp";

/**
 * The page people see when a link is wrong or something breaks (NFR-08):
 * the logo, one plain sentence, a way back home and, once the support number
 * is set in src/lib/contact.ts, a WhatsApp link to tell us.
 */
export function ErrorScreen({
  title,
  message,
  whatsAppMessage,
  children,
}: {
  title: string;
  message: string;
  whatsAppMessage: string;
  /** Extra buttons before "Back to home", such as Try again. */
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" aria-label="RentLoop home" className="mb-8">
        <Logo />
      </Link>
      <section className={`${cardClass} w-full max-w-md p-6 text-center sm:p-8`}>
        <h1 className="text-[22px] font-semibold sm:text-2xl">{title}</h1>
        <p className="mt-3 text-foreground-soft">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          {children}
          <Link href="/" className={buttonClasses({ variant: children ? "white" : "green", wrap: true })}>
            Back to home
          </Link>
        </div>
        {SUPPORT_WHATSAPP && (
          <p className="mt-5 text-sm text-muted-foreground">
            Still stuck?{" "}
            <a href={whatsAppLink(whatsAppMessage, SUPPORT_WHATSAPP)} className="font-medium text-primary underline">
              Tell us on WhatsApp
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
