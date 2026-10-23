import { HelpButton, SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TopStrip } from "@/components/top-strip";
import { displayName, type Viewer } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

// Public pages: the homepage, terms and privacy, inside the build kit shell.
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  // Signed-in users only reach terms and privacy here for now (proxy.ts sends
  // them from the homepage to their calendar), so the header shows who they are.
  const { data } = await (await createClient()).auth.getClaims();
  const claims = data?.claims;
  const viewer: Viewer = claims ? { name: displayName(claims.user_metadata?.full_name, claims.email) } : null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopStrip />
      <SiteHeader viewer={viewer} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <HelpButton />
    </div>
  );
}
