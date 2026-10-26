// The app draws icons as SVGs from src/components/icons.tsx, never as emojis
// or text symbols (✓ ★ → ▾ ●): those look different on every phone and screen
// readers read them out. Plain text marks like × in "3 × Tent", ·, … and – are fine.

const SYMBOL_ICON =
  /[ℹ←-⇿⌀-⏿■-◿☀-⥿⬀-⯿️]|[\u{1F000}-\u{1FAFF}]/gu;

/** Each emoji or symbol icon in `text`, with its 1-based line number. */
export function findSymbolIcons(text: string): { line: number; symbol: string }[] {
  return text.split("\n").flatMap((content, i) => [...content.matchAll(SYMBOL_ICON)].map((m) => ({ line: i + 1, symbol: m[0] })));
}
