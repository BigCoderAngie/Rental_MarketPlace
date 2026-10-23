import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/signup";
import { supabaseEnv } from "@/lib/supabase/env";

// Signed-out visitors may open these (build kit rule 20: Home, Explore and
// item pages); /q/ and /b/ are the customer's quote and booking links.
// PUBLIC_PAGES match exactly: "/" is the homepage, and as a prefix it would match every page.
const PUBLIC_PATHS = ["/login", "/signin", "/join", "/signup/", "/auth", "/q/", "/b/", "/items/"];
// /styleguide is a design check page for your computer only (its page answers 404 on the live site).
const PUBLIC_PAGES = ["/", "/explore", "/terms", "/privacy", ...(process.env.NODE_ENV === "production" ? [] : ["/styleguide"])];
// Sign-in and sign-up pages that make no sense once signed in. Not "Choose a
// new password" or "Check your email", which people reach from an email link.
const SIGNED_OUT_ONLY = ["/signin", "/signin/code", "/signin/forgot", "/join", "/signup/renter", "/signup/renter/about", "/signup/owner", "/signup/owner/details"];

// Refreshes the Supabase session on every request and sends signed-out
// visitors to the sign-in page.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([header, value]) =>
          response.headers.set(header, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;

  // Signed-in people who open a sign-in or sign-up page go where ?next= says, or home.
  if (signedIn && SIGNED_OUT_ONLY.includes(path)) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next")) ?? "/";
    return redirectKeepingSession(new URL(next, request.url), response);
  }

  if (!signedIn && !PUBLIC_PAGES.includes(path) && !PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/signin";
    // Come back here after signing in (build kit rule 20).
    signIn.search = new URLSearchParams({ next: path + request.nextUrl.search }).toString();
    return redirectKeepingSession(signIn, response);
  }

  return response;
}

// A redirect that keeps any session cookies refreshed above, and the headers that stop them being cached.
function redirectKeepingSession(to: URL, response: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(to);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
