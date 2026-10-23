import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { COLLECTION_TOWNS } from "@/lib/listing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "List an item | RentLoop" };

// Build kit Part 9: docs/build-kit/reference/desktop/SiteList.html and mobile/SiteList.html.
export default async function ListItemPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = await supabase.from("profiles").select("home_town").eq("user_id", claims?.claims?.sub ?? "").maybeSingle<{ home_town: string | null }>();
  const town = profile?.home_town && COLLECTION_TOWNS.includes(profile.home_town) ? profile.home_town : "Windhoek";
  return <ListingForm defaultTown={town} />;
}
