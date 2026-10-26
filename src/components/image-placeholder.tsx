/**
 * Stands in for a photo until owners upload real ones (build kit rule 5): the
 * kit's "Photo coming soon" image at the same shape and corners as the photo it
 * replaces. Sample photos are never used on the site.
 */
export function ImagePlaceholder({
  aspect = "4 / 3",
  radius = "var(--radius-card)",
  alt = "Photo coming soon",
  className = "",
}: {
  /** CSS aspect-ratio, for example "4 / 3" or "16 / 9". */
  aspect?: string;
  /** CSS border-radius, for example "var(--radius-card)" or "22px". */
  radius?: string;
  /** Pass "" when the picture is decorative. */
  alt?: string;
  className?: string;
}) {
  return (
    // A tiny local SVG: next/image would add nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/placeholders/item-photo-placeholder.svg"
      alt={alt}
      className={`block w-full object-cover ${className}`}
      style={{ aspectRatio: aspect, borderRadius: radius }}
    />
  );
}
