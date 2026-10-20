import { ErrorNote, Field, buttonClass, inputClass } from "@/components/ui";
import { createBusiness } from "./actions";

export default async function SetupPage({ searchParams }: PageProps<"/setup">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold">Set up your business</h1>
      <p className="mb-6 text-sm text-muted-foreground">You can change these details later.</p>
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      <form action={createBusiness} className="space-y-4">
        <Field label="Business name">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Towns you serve" hint="Separate towns with commas, for example Windhoek, Okahandja">
          <input name="towns" className={inputClass} />
        </Field>
        <button className={`${buttonClass} w-full`}>Continue</button>
      </form>
    </main>
  );
}
