import { redirect } from "next/navigation";
import { signupHref, signupStart } from "@/lib/signup-start";

// The two sign-up paths became one (one account rents and lists); old links forward.
export default async function OldSignupPage({ searchParams }: PageProps<"/signup/renter/about">) {
  redirect(signupHref("/signup/about", "rent", signupStart(await searchParams).next));
}
