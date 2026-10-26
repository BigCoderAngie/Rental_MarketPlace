import type { Metadata } from "next";
import { ExploreBrowser } from "@/components/explore-browser";

export const metadata: Metadata = {
  title: "Explore rentals near you | RentLoop",
  description: "Cameras, tents, tools and party gear to rent from people and hire businesses near you in Namibia. Free to request.",
};

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  return <ExploreBrowser params={await searchParams} />;
}
