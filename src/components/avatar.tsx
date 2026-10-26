import { initials } from "@/lib/site-links";

/** A mint circle with the person's initials (kit `.avatar`): 40px on desktop, 36px in the phone header. */
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-ink ${small ? "h-9 w-9 text-[13px]" : "h-10 w-10 text-sm"}`}
    >
      {initials(name)}
    </span>
  );
}
