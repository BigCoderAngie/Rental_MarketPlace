import type { Metadata } from "next";
import { PlaceholderPage } from "../placeholder-page";

export const metadata: Metadata = { title: "Privacy | Rental Marketplace", robots: { index: false } };

// PLACEHOLDER until the real text is written.
export default function Page() {
  return <PlaceholderPage title="Privacy" topic="our privacy policy" />;
}
