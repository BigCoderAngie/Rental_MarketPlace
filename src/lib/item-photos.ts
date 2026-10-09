import type { SupabaseClient } from "@supabase/supabase-js";

// Item photos (one per item) live in a public bucket so quote pages can show
// them without signing in. Paths start with the business id.

export const ITEM_PHOTO_BUCKET = "item-photos";

export function itemPhotoFolder(businessId: string): string {
  return `${businessId}/items`;
}

/** Public address of an item photo, or null when the item has none. */
export function itemPhotoUrl(supabase: SupabaseClient, path: string | null | undefined): string | null {
  return path ? supabase.storage.from(ITEM_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl : null;
}
