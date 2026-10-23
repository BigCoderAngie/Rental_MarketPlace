import { redirect } from "next/navigation";

// The old sign-in address forwards to the build kit's /signin (build kit
// decision 8), keeping ?error= and ?next= from older links.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/signin?${query}` : "/signin");
}
