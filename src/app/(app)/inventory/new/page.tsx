import { ErrorNote, LinkButton, PageHeader } from "@/components/ui";
import type { Plan } from "@/lib/plans";
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
  const [{ data: plan }, { count }] = await Promise.all([
    supabase.rpc("business_plan", { p_business_id: business.id }).single<Plan>(),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("archived", false),
  ]);

  // FR-PL-02: at the plan's item limit, offer an upgrade instead of the form.
  if (plan?.item_limit != null && (count ?? 0) >= plan.item_limit) {
    return (
      <>
        <PageHeader title="Add item" />
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Your {plan.name} plan allows {plan.item_limit} items, and you have {count}.</p>
          <p className="mt-1">Upgrade to Pro or Business to add more, or remove an item you no longer rent out.</p>
          <div className="mt-3">
            <LinkButton href="/plan?limit=items">See plans</LinkButton>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Add item" />
      <ErrorNote message={typeof error === "string" ? error : undefined} />
      <ItemForm action={createItem} categories={categories ?? []} businessId={business.id} />
    </>
  );
}
