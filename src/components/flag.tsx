/**
 * The flag of Namibia from the build kit (public/brand/flag-namibia.svg), small
 * (18 to 26px wide) with 3px corners and a hairline outline. Only where the
 * wireframes show it: top strip, hero pill, app section, footer, sign-up headers.
 * An image file, so the browser downloads it once and reuses it everywhere.
 */
export function Flag({ width = 22 }: { width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a tiny local SVG; next/image adds nothing
    <img
      src="/brand/flag-namibia.svg"
      width={width}
      height={(width * 2) / 3}
      alt="Flag of Namibia"
      className="block shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,.12)]"
    />
  );
}
