import { notFound } from "next/navigation";
import { ErrorNote, PageHeader, secondaryButtonClass } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import type { Category, Item } from "@/lib/types";
import { archiveItem, updateItem } from "../actions";
import { ItemForm } from "../item-form";

export default async function EditItemPage({ params, searchParams }: PageProps<"/inventory/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireBusiness();

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle<Item>(),
    supabase.from("categories").select("slug, name").order("sort_order").returns<Category[]>(),
  ]);
  if (!item) notFound();

  return (
    <>
      <PageHeader title={item.name} />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      <ItemForm action={updateItem.bind(null, item.id)} categories={categories ?? []} item={item} />
      <form action={archiveItem.bind(null, item.id)} className="mt-6">
        <button className={`${secondaryButtonClass} w-full`}>Remove from inventory</button>
        <p className="mt-1 text-xs text-zinc-500">Past bookings keep their record of this item.</p>
      </form>
    </>
  );
}
