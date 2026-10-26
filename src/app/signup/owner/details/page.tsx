import { redirect } from "next/navigation";
import { signupHref, signupNext } from "@/lib/signup-start";

// The two sign-up paths became one (one account rents and lists); old links forward.
export default async function OldSignupPage({ searchParams }: PageProps<"/signup/owner/details">) {
  redirect(signupHref("/signup/about", signupNext(await searchParams)));
}