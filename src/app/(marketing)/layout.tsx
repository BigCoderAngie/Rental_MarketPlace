import { SiteFooter } from "@/components/site-footer";
import { TopBar } from "@/components/top-bar";
import { createClient } from "@/lib/supabase/server";

// Public pages for signed-out visitors: the homepage, terms and privacy.
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  // Signed-in users only reach terms and privacy here (proxy.ts sends them
  // from the homepage to their calendar), so give them a way back.
  const { data } = await (await createClient()).auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar signedIn={signedIn} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
