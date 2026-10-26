import { NextResponse, type NextRequest } from "next/server";
import { homeAfterSignIn } from "@/lib/business";
import { safeNextPath } from "@/lib/signup";
import { createClient } from "@/lib/supabase/server";

// Landing page for the links in our emails: sign-in code, confirm your email
// (?next=/welcome) and choose a new password (?next=/signin/new-password).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const supabase = await createClient();

  // Supabase sends people here with ?error= when a link has expired or was already used.
  if (request.nextUrl.searchParams.has("error")) {
    const signIn = new URL("/signin", request.url);
    signIn.searchParams.set("error", "That link has expired or was already used. Sign in, or ask for a new link.");
    return NextResponse.redirect(signIn);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const signIn = new URL("/signin", request.url);
      signIn.searchParams.set("error", "That link has expired. Sign in, or ask for a new link.");
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.redirect(new URL(next ?? (await homeAfterSignIn(supabase)), request.url));
}
