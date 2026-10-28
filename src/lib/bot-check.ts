import { flags } from "./flags";

/**
 * The "I'm human" check on sign-up, sign-in, "email me a code" and "forgot
 * password" (task signup-bot-check, NFR-05). Cloudflare Turnstile puts a
 * one-time token in the form; the server action hands it to Supabase Auth,
 * which checks it with Cloudflare. Setup: docs/setup/bot-check.md.
 *
 * Turn Supabase's check on only after the site sends tokens, or nobody can
 * sign in.
 */

/** The form field the widget fills with its token. */
export const BOT_CHECK_FIELD = "captchaToken";

/** Shown when Supabase turns a request down because the check failed or wasn't finished. */
export const BOT_CHECK_FAILED = "The \"I'm human\" check didn't go through. Wait for its tick, then try again.";

/** The Turnstile site key, or null while the check is switched off or has no key. */
export function botCheckSiteKey(on: boolean = flags.botCheck, key: string | undefined = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY): string | null {
  return on && key?.trim() ? key.trim() : null;
}

/** The token from a submitted form, ready to spread into a Supabase Auth call's options. */
export function captchaOption(formData: FormData): { captchaToken?: string } {
  const token = String(formData.get(BOT_CHECK_FIELD) ?? "").trim();
  return token ? { captchaToken: token } : {};
}

/** Supabase's answer when the token is missing, used or wrong. */
export function isBotCheckError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "captcha_failed";
}
