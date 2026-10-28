import { AccountSidebar } from "@/components/account-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TopStrip } from "@/components/top-strip";
import { displayName } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

// The renter and owner areas (build kit Parts 7 and 8): the deep green
// sidebar on desktop; the site header, page and footer on phones and tablets.
export default async function AccountLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [{ data: claims }, { data: businesses }, { data: summary }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("businesses").select("kind").limit(1),
    supabase.rpc("owner_summary"),
  ]);
  const c = claims?.claims;
  const business = businesses?.[0] as { kind: string } | undefined;
  const viewer = c ? { name: displayName(c.user_metadata?.full_name, c.email), lists: Boolean(business) } : null;

  return (
    <div className="flex min-h-screen">
      <AccountSidebar waiting={(summary as { waiting_requests?: number } | null)?.waiting_requests ?? 0} hasBusiness={Boolean(business)} isHireBusiness={business?.kind === "business"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <TopStrip />
          <SiteHeader viewer={viewer} />
        </div>
        <main className="flex-1 px-4 pt-5 pb-12 md:px-8 lg:px-10 lg:pt-10">{children}</main>
        <div className="lg:hidden">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
