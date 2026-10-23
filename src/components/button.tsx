import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

/**
 * The lit, press-down button from the build kit (docs/build-kit/01-DESIGN-SYSTEM.md
 * section 4). The lighting is the `.b3` class in globals.css, copied exactly.
 *
 * - green: Search, Send request, Next, Create my account, List an item
 * - yellow: Sign up free, Request to book, Publish, Create account and list
 * - white: Sign in, Back, Previous, Reset
 * - mint: View booking
 * - outline: secondary buttons on deep green
 *
 * Sizes: sm 40px, md 48px, lg 56px, chip (40px pill), cta (46px full-width pill).
 */
export type ButtonVariant = "green" | "yellow" | "white" | "mint" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "chip" | "cta";

const VARIANT: Record<ButtonVariant, string> = {
  green: "rl-g",
  yellow: "rl-y",
  white: "rl-w",
  mint: "rl-lt",
  outline: "rl-ol",
};

const SIZE: Record<ButtonSize, string> = { sm: "rl-sm", md: "", lg: "rl-lg", chip: "rl-chip", cta: "rl-cta" };

// Visible keyboard focus in brand green; ui.tsx re-exports these for links and other controls.
export const focusRingClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
// Same, drawn just inside the edge, for items in scrolling or rounded clipped lists where an outer ring would be cut off.
export const focusRingInsetClass = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";
// White, for the outline variant and anything else on deep green.
const focusRingOnDeepClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-foreground";

// The kit's buttons have a fixed height and one line. `wrap` lets long labels
// (business names in the older pages) wrap instead, staying at least 48px tall.
const WRAP = "h-auto min-h-12 whitespace-normal py-2 text-center";

type Look = { variant?: ButtonVariant; size?: ButtonSize; wrap?: boolean };

export function buttonClasses({ variant = "green", size = "md", wrap = false, className = "" }: Look & { className?: string } = {}): string {
  const focus = variant === "outline" ? focusRingOnDeepClass : focusRingClass;
  return ["b3 rl-btn", VARIANT[variant], SIZE[size], focus, wrap && WRAP, className].filter(Boolean).join(" ");
}

export function Button({ variant, size, wrap, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & Look) {
  return <button type={type} className={buttonClasses({ variant, size, wrap, className })} {...props} />;
}

/** A link that looks like a button (most of the kit's buttons go to another page). */
export function ButtonLink({ variant, size, wrap, className, ...props }: ComponentProps<typeof Link> & Look) {
  return <Link className={buttonClasses({ variant, size, wrap, className })} {...props} />;
}
