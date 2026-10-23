import { redirect } from "next/navigation";
import { signupHref, signupStart } from "@/lib/signup-start";

// The two sign-up paths became one (one account rents and lists); old links forward.
export default async function OldSignupPage({ searchParams }: PageProps<"/signup/owner">) {
  redirect(signupHref("/signup", "earn", signupStart(await searchParams).next));
}
