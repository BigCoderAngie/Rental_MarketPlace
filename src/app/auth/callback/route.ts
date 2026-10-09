import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing page for the sign-in link in the email.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const target = new URL("/", request.url);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      target.pathname = "/login";
      target.searchParams.set("error", "That sign-in link has expired. Ask for a new code.");
    }
  }

  return NextResponse.redirect(target);
}
