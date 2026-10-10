import { notFound } from "next/navigation";
import { ErrorNote, PageHeader, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import type { Package } from "@/lib/packages";
import { archivePackage, updatePackage } from "../actions";
import { PackageForm } from "../package-form";

export default async function EditPackagePage({ params, searchParams }: PageProps<"/inventory/packages/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();

  const [{ data: pkg }, { data: items }] = await Promise.all([
    supabase
      .from("packages")
      .select("*, package_items(item_id, quantity, items(name))")
      .eq("id", id)
      .eq("archived", false)
      .maybeSingle<Package>(),
    supabase
      .from("items")
      .select("id, name, daily_price")
      .eq("business_id", business.id)
      .eq("archived", false)
      .order("name"),
  ]);
  if (!pkg) notFound();

  return (
    <>
      <PageHeader title={pkg.name} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      <PackageForm action={updatePackage.bind(null, pkg.id)} items={items ?? []} pkg={pkg} />
      <p className="mt-2 text-xs text-zinc-500">A new price applies to new bookings and quotes. Existing ones keep their price.</p>
      <form action={archivePackage.bind(null, pkg.id)} className="mt-6">
        <button className={`${secondaryButtonClass} w-full`}>Remove package</button>
        <p className="mt-1 text-xs text-zinc-500">Bookings that already include it are not changed.</p>
      </form>
    </>
  );
}
