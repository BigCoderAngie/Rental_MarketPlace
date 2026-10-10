import Link from "next/link";
import { LinkButton, PageHeader } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { formatNad } from "@/lib/money";
import { itemPhotoUrl } from "@/lib/item-photos";
import { packageContents, type Package } from "@/lib/packages";
import type { Item } from "@/lib/types";

export default async function InventoryPage() {
  const { supabase, business } = await requireBusiness();
  const { data: items, error } = await supabase
    .from("items")
    .select("*")
    .eq("business_id", business.id)
    .eq("archived", false)
    .order("name")
    .returns<Item[]>();
  if (error) throw error;
  const { data: packages } = await supabase
    .from("packages")
    .select("*, package_items(item_id, quantity, items(name))")
    .eq("business_id", business.id)
    .eq("archived", false)
    .order("name")
    .returns<Package[]>();

  return (
    <>
      <PageHeader title="Inventory" action={<LinkButton href="/inventory/new">Add item</LinkButton>} />

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600">No items yet. Add your first item to start taking bookings.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/inventory/${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                {item.photo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL
                  <img src={itemPhotoUrl(supabase, item.photo_path)!} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.name}</span>
                  <span className="text-sm text-zinc-600">
                    {formatNad(item.daily_price)} per day
                    {item.turnaround_days > 0 && ` · ${item.turnaround_days} day turnaround`}
                  </span>
                </span>
                <span className="text-right text-sm">
                  <span className="block font-semibold">{item.quantity_owned - item.units_out_of_service} in service</span>
                  {item.units_out_of_service > 0 && (
                    <span className="text-amber-700">{item.units_out_of_service} out of service</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Packages</h2>
            <Link href="/inventory/packages/new" className="text-sm font-medium text-emerald-800 underline">
              Add package
            </Link>
          </div>
          {(packages ?? []).length === 0 ? (
            <p className="text-sm text-zinc-600">
              Group items you rent together, like a tent with 100 chairs, and give them one price per day.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {packages!.map((pkg) => (
                <li key={pkg.id}>
                  <Link href={`/inventory/packages/${pkg.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{pkg.name}</span>
                      <span className="text-sm text-zinc-600">{packageContents(pkg)}</span>
                    </span>
                    <span className="text-right text-sm font-semibold">{formatNad(pkg.daily_price)} per day</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
