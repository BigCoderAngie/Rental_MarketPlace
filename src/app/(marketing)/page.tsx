import type { Metadata } from "next";
import { ExploreBrowser } from "@/components/explore-browser";
import { AppPromo, EarnSection, Faq, HowItWorks, Reviews } from "@/components/home-sections";

const DESCRIPTION =
  "Rent cameras, tents, tools and party gear from people and hire businesses near you, all over Namibia. Free to request, no fees for renters. We only earn when you earn.";

export const metadata: Metadata = {
  title: "RentLoop | Why buy it? Rent it nearby.",
  description: DESCRIPTION,
  openGraph: {
    title: "Why buy it? Rent it nearby.",
    description: DESCRIPTION,
    type: "website",
    locale: "en_NA",
    siteName: "RentLoop",
  },
};

// The home page opens on the items, with search and filters, so anyone can
// browse without an account; signing up is only asked for to rent. The kit's
// other home sections (docs/build-kit/reference/desktop/SiteHome.html) follow.
export default function HomePage() {
  return (
    <>
      <ExploreBrowser params={{}} />
      <div className="wrap flex flex-col gap-10 pb-12 md:gap-[72px] md:pb-[72px]">
        <HowItWorks />
        <EarnSection />
        <Reviews />
        <AppPromo />
        <Faq />
      </div>
    </>
  );
}
