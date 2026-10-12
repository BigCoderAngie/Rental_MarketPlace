// Packages (FR-IN-03): items grouped with a package price per day.

export type PackageItem = { item_id: string; quantity: number; items: { name: string } | null };

export type Package = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  daily_price: number;
  archived: boolean;
  package_items: PackageItem[];
};

/** Package lines from a form whose quantity inputs are named "pkg:<package id>". */
export function readPackageLines(formData: FormData) {
  return [...formData.entries()]
    .filter(([key]) => key.startsWith("pkg:"))
    .map(([key, value]) => ({ package_id: key.slice(4), quantity: Number(value) }))
    .filter((line) => Number.isInteger(line.quantity) && line.quantity > 0);
}

/** How many whole packages fit in what is free: the scarcest item decides. */
export function packagesFree(pkg: Pick<Package, "package_items">, free: Map<string, number>): number {
  if (pkg.package_items.length === 0) return 0;
  return Math.min(...pkg.package_items.map((pi) => Math.floor((free.get(pi.item_id) ?? 0) / pi.quantity)));
}

/** "1 × Tent, 100 × Chair" */
export function packageContents(pkg: Pick<Package, "package_items">): string {
  return [...pkg.package_items]
    .sort((a, b) => (a.items?.name ?? "").localeCompare(b.items?.name ?? ""))
    .map((pi) => `${pi.quantity} × ${pi.items?.name}`)
    .join(", ");
}
