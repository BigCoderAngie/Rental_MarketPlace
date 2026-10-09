import { ErrorNote, PageHeader } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import type { Category } from "@/lib/types";
import { createItem } from "../actions";
import { ItemForm } from "../item-form";

export default async function NewItemPage({ searchParams }: PageProps<"/inventory/new">) {
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name")
    .order("sort_order")
    .returns<Category[]>();

  return (
    <>
      <PageHeader title="Add item" />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      <ItemForm action={createItem} categories={categories ?? []} businessId={business.id} />
    </>
  );
}
