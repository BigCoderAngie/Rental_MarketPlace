import type { Metadata } from "next";
import { PlaceholderPage } from "../placeholder-page";

export const metadata: Metadata = { title: "Terms of use | Rental Marketplace", robots: { index: false } };

// PLACEHOLDER until the real text is written.
export default function Page() {
  return <PlaceholderPage title="Terms of use" topic="our terms of use" />;
}
