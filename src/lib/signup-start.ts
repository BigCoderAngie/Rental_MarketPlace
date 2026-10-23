// The one sign-up keeps where someone started (Join's two cards: ?start=rent
// or ?start=earn) and where to go back to afterwards (?next=), across both steps.

import { safeNextPath } from "./signup";

type Params = Record<string, string | string[] | undefined>;

export function signupStart(params: Params): { start: "rent" | "earn"; next: string | null } {
  return { start: params.start === "earn" ? "earn" : "rent", next: safeNextPath(typeof params.next === "string" ? params.next : null) };
}

/** A sign-up step's address with the start and next kept, for example "/signup/about?start=earn". */
export function signupHref(path: string, start: "rent" | "earn", next: string | null): string {
  const params = new URLSearchParams();
  if (start === "earn") params.set("start", "earn");
  if (next) params.set("next", next);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
