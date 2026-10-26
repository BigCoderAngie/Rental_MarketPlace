"use client";

import { useRouter } from "next/navigation";
import { SORTS, type Sort } from "@/lib/explore";

/**
 * "Sort: Recommended" with a drop-down arrow from the kit, as a real select: picking an order opens
 * the same search sorted that way. `hrefs` holds the address for each order.
 */
export function SortMenu({ value, hrefs }: { value: Sort; hrefs: Record<Sort, string> }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-1 text-[15px] font-bold text-primary">
      <span>Sort:</span>
      <select
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value as Sort], { scroll: false })}
        className="cursor-pointer rounded bg-transparent py-2.5 font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {(Object.keys(SORTS) as Sort[]).map((sort) => (
          <option key={sort} value={sort}>
            {SORTS[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}
