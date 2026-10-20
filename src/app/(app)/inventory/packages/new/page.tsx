import { ErrorNote, PageHeader } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { createPackage } from "../actions";
import { PackageForm } from "../package-form";

export default async function NewPackagePage({ searchParams }: PageProps<"/inventory/packages/new">) {
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();
  const { data: items } = await supabase
    .from("items")
    .select("id, name, daily_price")
    .eq("business_id", business.id)
    .eq("archived", false)
    .order("name");

  return (
    <>
      <PageHeader title="New package" />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      <p className="mb-4 text-sm text-muted-foreground">
        Group items you often rent together, like a tent with 100 chairs, and give the group one price per day.
      </p>
      <PackageForm action={createPackage} items={items ?? []} />
    </>
  );
}
