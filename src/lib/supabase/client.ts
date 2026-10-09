import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components, acting as the signed-in user.
// Used for uploading photos straight from the phone to storage.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
