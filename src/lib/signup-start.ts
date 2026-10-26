// The one sign-up keeps where to go afterwards (?next=, for example the item a
// visitor wanted to request, or List an item) across both steps.

import { safeNextPath } from "./signup";

type Params = Record<string, string | string[] | undefined>;

export function signupNext(params: Params): string | null {
  return safeNextPath(typeof params.next === "string" ? params.next : null);
}

/** A sign-up step's address with next kept, for example "/signup/about?next=%2Fowner%2Flist". */
export function signupHref(path: string, next: string | null): string {
  return next ? `${path}?${new URLSearchParams({ next })}` : path;
}
