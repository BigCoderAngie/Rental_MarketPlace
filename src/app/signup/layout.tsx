import type { ReactNode } from "react";
import { SignupDraftProvider } from "@/components/signup-draft";

// Keeps step 1 of either sign-up path in memory while the person fills in step 2 (signup-draft.tsx).
export default function SignupLayout({ children }: { children: ReactNode }) {
  return <SignupDraftProvider>{children}</SignupDraftProvider>;
}
