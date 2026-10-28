/**
 * Feature switches (docs/RELEASING.md, "Feature flags"). A feature merges
 * switched off in Production and on in Preview, then is turned on in Vercel
 * without a code change. Each NEXT_PUBLIC_FLAG_* must be written out in full
 * so Next.js can put its value into the browser code.
 */
export function isOn(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "on";
}

export const flags = {
  // NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN=on shows "Continue with Google" (task google-sign-in).
  googleSignIn: isOn(process.env.NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN),
  // NEXT_PUBLIC_FLAG_NOTIFICATIONS=on shows the notifications bell (task notifications-ui).
  notifications: isOn(process.env.NEXT_PUBLIC_FLAG_NOTIFICATIONS),
  // NEXT_PUBLIC_FLAG_BOT_CHECK=on shows the "I'm human" check on sign-up and sign-in (task signup-bot-check).
  botCheck: isOn(process.env.NEXT_PUBLIC_FLAG_BOT_CHECK),
};
