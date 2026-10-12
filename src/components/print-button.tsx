"use client";

import { secondaryButtonClass } from "./ui";

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${secondaryButtonClass} w-full print:hidden`}>
      {label}
    </button>
  );
}
