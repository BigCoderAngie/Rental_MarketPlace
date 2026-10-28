"use client";

import { useEffect, useRef } from "react";
import { BOT_CHECK_FIELD, botCheckSiteKey } from "@/lib/bot-check";

// Cloudflare Turnstile's "I'm human" box (src/lib/bot-check.ts). The script
// loads only on pages that show the box, without an npm package. The box
// puts its token in a hidden captchaToken field inside the surrounding form.

type Turnstile = {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<Turnstile> | null = null;

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not start")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile did not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Put inside a form, above its submit button. Shows nothing while the check is switched off. */
export function BotCheck() {
  const siteKey = botCheckSiteKey();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!siteKey || !element) return;
    let widgetId: string | undefined;
    let gone = false;

    loadTurnstile()
      .then((turnstile) => {
        if (gone) return;
        widgetId = turnstile.render(element, {
          sitekey: siteKey,
          "response-field-name": BOT_CHECK_FIELD,
          size: "flexible",
          theme: "auto",
        });
      })
      // Without the script the form still sends; Supabase then answers with BOT_CHECK_FAILED.
      .catch(() => {});

    // A token works once. The form has read it by the time this runs, so get a
    // fresh one for the next try (the page stays open when the server answers
    // with a problem, such as a wrong password).
    const form = element.closest("form");
    const renew = () => setTimeout(() => widgetId && window.turnstile?.reset(widgetId));
    form?.addEventListener("submit", renew);

    return () => {
      gone = true;
      form?.removeEventListener("submit", renew);
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  // Room for the box before it loads, so the button doesn't jump down.
  return <div ref={box} className="min-h-[65px]" />;
}
