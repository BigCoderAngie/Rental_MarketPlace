import { ErrorNote, Field, buttonClass, inputClass } from "@/components/ui";
import { sendCode, verifyCode } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold">RentLoop</h1>
      <p className="mb-6 text-sm text-muted-foreground">Sign in to manage your hire business.</p>
      <ErrorNote message={error} />

      {sent ? (
        <form action={verifyCode} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <p className="text-sm">
            We sent a code to <strong>{email}</strong>. Enter it below, or open the link in the email.
          </p>
          <Field label="Code">
            <input
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className={inputClass}
            />
          </Field>
          <button className={`${buttonClass} w-full`}>Sign in</button>
          <a href="/login" className="block text-center text-sm text-muted-foreground underline">
            Use a different email
          </a>
        </form>
      ) : (
        <form action={sendCode} className="space-y-4">
          <Field label="Email">
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={email}
              required
              className={inputClass}
            />
          </Field>
          <button className={`${buttonClass} w-full`}>Send me a code</button>
        </form>
      )}
    </main>
  );
}
