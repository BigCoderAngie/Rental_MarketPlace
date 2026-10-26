/** Formats an amount as Namibian dollars, e.g. "N$1,250.00". */
export function formatNad(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `N$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Whole Namibian dollars for prices on listing cards, e.g. "N$650" or "N$6,500" (cents are rounded). */
export function formatNadWhole(amount: number): string {
  return `N$${Math.round(amount).toLocaleString("en-US")}`;
}
