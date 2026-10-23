"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { firstName, type AccountInput } from "@/lib/signup";

type Draft = { account: AccountInput | null; setAccount: (a: AccountInput) => void };

const DraftContext = createContext<Draft | null>(null);

/**
 * Holds step 1 (Account) while the person fills in step 2. It lives in the
 * sign-up layout, which stays mounted between the two pages, and only in
 * memory: the password is never stored. Reloading step 2 starts again at step 1.
 */
export function SignupDraftProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AccountInput | null>(null);
  return <DraftContext.Provider value={{ account, setAccount }}>{children}</DraftContext.Provider>;
}

export function useSignupDraft(): Draft {
  const draft = useContext(DraftContext);
  if (!draft) throw new Error("useSignupDraft needs SignupDraftProvider (the sign-up layout)");
  return draft;
}

/** "Almost done, Tangeni." on step 2, with the name typed on step 1. */
export function AlmostDone() {
  const { account } = useSignupDraft();
  const name = account ? firstName(account.fullName) : "";
  return <>Almost done{name ? `, ${name}` : ""}.</>;
}
