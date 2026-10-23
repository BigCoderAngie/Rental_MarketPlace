// Sign-up rules for the build kit's two paths (docs/build-kit 02-BUSINESS-RULES.md
// §16-18): Account (name, email, mobile, password) then About you (renters) or
// Owner details (owners). The forms check these in the browser for quick
// messages, and the server action checks them again before creating the account.

/** Home towns on the sign-up forms (build kit rule 25; every town is allowed here). */
export const SIGNUP_TOWNS = ["Windhoek", "Swakopmund", "Walvis Bay", "Oshakati", "Rundu", "Other"];

export const MIN_PASSWORD_LENGTH = 8;

export type AccountInput = { fullName: string; email: string; phone: string; password: string; confirm: string };
export type Errors<K extends string> = Partial<Record<K, string>>;

/**
 * A Namibian mobile number as typed after the +264 box ("81 234 5678",
 * "0812345678", "+264 81 234 5678") becomes "+264812345678". Returns null when
 * it isn't 9 digits after the country code and leading 0.
 */
export function normalizeNamibianMobile(input: string): string | null {
  let digits = input.replace(/[^0-9]/g, "");
  if (digits.startsWith("264")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^[0-9]{9}$/.test(digits) ? `+264${digits}` : null;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateAccount(input: AccountInput): Errors<keyof AccountInput> {
  const errors: Errors<keyof AccountInput> = {};
  if (!input.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!isEmail(input.email)) errors.email = "Enter an email address, for example you@example.com.";
  if (!normalizeNamibianMobile(input.phone)) errors.phone = "Enter your mobile number, for example 81 234 5678.";
  if (input.password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (input.confirm !== input.password) errors.confirm = "The passwords don't match.";
  return errors;
}

/** What an owner answers once, at sign-up (picking Earn) or before their first listing. */
export type OwnerTerms = { ownerKind: string; businessName: string; feeAcknowledged: boolean };
/** Step 2 of the one sign-up: everyone answers town, Rent or Earn and Terms; Earn adds the owner questions. */
export type AboutYou = { town: string; firstGoal: string; terms: boolean } & OwnerTerms;

const TERMS_ERROR = "Tick this box to agree to the Terms and Conditions and Privacy Policy.";

export function validateOwnerTerms(input: OwnerTerms): Errors<keyof OwnerTerms> {
  const errors: Errors<keyof OwnerTerms> = {};
  if (input.ownerKind !== "individual" && input.ownerKind !== "business") errors.ownerKind = "Choose how you are listing.";
  if (input.ownerKind === "business" && !input.businessName.trim()) errors.businessName = "Enter your business name.";
  if (!input.feeAcknowledged) errors.feeAcknowledged = "Tick this box to confirm you understand the booking fee.";
  return errors;
}

export function validateAboutYou(input: AboutYou): Errors<keyof AboutYou> {
  const errors: Errors<keyof AboutYou> = {};
  if (!SIGNUP_TOWNS.includes(input.town)) errors.town = "Choose your town.";
  if (input.firstGoal !== "rent" && input.firstGoal !== "earn") errors.firstGoal = "Choose what you want to do first.";
  if (input.firstGoal === "earn") Object.assign(errors, validateOwnerTerms(input));
  if (!input.terms) errors.terms = TERMS_ERROR;
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

/** First name for "Almost done, Tangeni." and "You're in, Tangeni!". */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

/**
 * Where a link may send someone after signing in: only a path on this site
 * ("/welcome"), never another site ("//evil.com", "https://..."). Browsers drop
 * tabs and line breaks from URLs and treat a backslash like "/", so any of those
 * anywhere is refused too (a tab in "/<tab>/evil.com" would make it "//evil.com").
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) return null;
  return new URL(next, "https://rentloop.invalid").origin === "https://rentloop.invalid" ? next : null;
}
