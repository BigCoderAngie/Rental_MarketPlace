import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

// Signed-out visitors may open these; /q/ and /b/ are the customer's quote
// and booking links. PUBLIC_PAGES match exactly: "/" is the homepage, and as
// a prefix it would match every page.
const PUBLIC_PATHS = ["/login", "/auth", "/q/", "/b/"];
// /styleguide is a design check page for your computer only (its page answers 404 on the live site).
const PUBLIC_PAGES = ["/", "/terms", "/privacy", ...(process.env.NODE_ENV === "production" ? [] : ["/styleguide"])];

// Refreshes the Supabase session on every request and sends signed-out
// visitors to the login page.
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

  // The homepage is for visitors; signed-in users start on their calendar.
  if (signedIn && path === "/") {
    const calendar = request.nextUrl.clone();
    calendar.pathname = "/calendar";
    const redirect = NextResponse.redirect(calendar);
    // Keep any session cookies refreshed above, and the headers that stop them being cached.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  }

  if (!signedIn && !PUBLIC_PAGES.includes(path) && !PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
