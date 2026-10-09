import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, type IsoDate } from "./dates";
import type { AvailabilityRow, Item } from "./types";

/**
 * The business's items, and for each the lowest number of units free on any
 * day from start to end (plus that item's turnaround days, which a new
 * booking would also hold). Pass end = null to skip the availability lookup.
 */
export async function itemsWithFreeUnits(
  supabase: SupabaseClient,
  businessId: string,
  start: IsoDate,
  end: IsoDate | null,
) {
  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .eq("business_id", businessId)
    .eq("archived", false)
    .order("name")
    .returns<Item[]>();
  if (error) throw error;

  const free = new Map<string, number>();
  if (end && items.length) {
    const longestTurnaround = Math.max(...items.map((i) => i.turnaround_days));
    const { data, error: rpcError } = await supabase.rpc("item_availability", {
      p_business_id: businessId,
      p_from: start,
      p_to: addDays(end, longestTurnaround),
    });
    if (rpcError) throw rpcError;

    const lastDay = new Map(items.map((i) => [i.id, addDays(end, i.turnaround_days)]));
    for (const r of (data ?? []) as AvailabilityRow[]) {
      if (r.day > lastDay.get(r.item_id)!) continue;
      free.set(r.item_id, Math.min(free.get(r.item_id) ?? Infinity, Math.max(r.available, 0)));
    }
  }

  return { items, free };
}

/** Item lines from a form whose quantity inputs are named "qty:<item id>". */
export function readLines(formData: FormData) {
  return [...formData.entries()]
    .filter(([key]) => key.startsWith("qty:"))
    .map(([key, value]) => ({ item_id: key.slice(4), quantity: Number(value) }))
    .filter((line) => Number.isInteger(line.quantity) && line.quantity > 0);
}
