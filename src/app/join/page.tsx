import { redirect } from "next/navigation";
import { signupHref, signupNext } from "@/lib/signup-start";

// Join used to pick between renting and earning. There is one sign-up now, so
// old /join links (and their ?next=) go straight to it.
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  redirect(signupHref("/signup", signupNext(await searchParams)));
}
