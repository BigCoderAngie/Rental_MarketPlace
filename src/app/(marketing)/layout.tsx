import { HelpButton, SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TopStrip } from "@/components/top-strip";
import { displayName, type Viewer } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";

// Public pages: the homepage, terms and privacy, inside the build kit shell.
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  // Everyone sees the home page; signed-in people get List an item and their avatar.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  // People who list items have a business; their account menu shows "Owner dashboard".
  const { data: businesses } = claims ? await supabase.from("businesses").select("id").limit(1) : { data: null };
  const viewer: Viewer = claims ? { name: displayName(claims.user_metadata?.full_name, claims.email), lists: Boolean(businesses?.length) } : null;

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
