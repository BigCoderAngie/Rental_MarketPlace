import { formatNad } from "@/lib/money";

/** Price list rows for packages on a booking or quote: name, contents, price. */
export function PackageLines({
  packages,
  days,
}: {
  packages: { name: string; quantity: number; daily_price: number; contents?: string }[];
  days: number;
}) {
  return packages.map((p, i) => (
    <li key={`pkg-${i}`} className="flex justify-between gap-2">
      <span>
        {p.quantity} × {p.name}
        {p.contents && <span className="block text-xs text-muted">{p.contents}</span>}
      </span>
      <span>{formatNad(p.quantity * p.daily_price * days)}</span>
    </li>
  ));
}
