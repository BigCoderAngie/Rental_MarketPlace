"use client";

import { useState } from "react";
import { ImagePlaceholder } from "@/components/image-placeholder";

/**
 * The item page gallery (SiteItem.html): a 16:9 photo with "1 / 4" and four
 * thumbnails below on desktop. Phones show the photo full width. Missing
 * photos show the kit's placeholder.
 */
export function ItemGallery({ photos, name }: { photos: string[]; name: string }) {
  const [shown, setShown] = useState(0);
  const slots = Math.max(photos.length, 1);
  const current = photos[shown];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden bg-store md:rounded-panel">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage
          <img src={current} alt={`${name}, photo ${shown + 1}`} className="block aspect-[4/3] w-full object-cover md:aspect-video" />
        ) : (
          <ImagePlaceholder alt="Photo coming soon" radius="0" aspect="16 / 9" />
        )}
        {photos.length > 1 && (
          <span className="absolute right-3.5 bottom-3.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
            {shown + 1} / {slots}
          </span>
        )}
      </div>
      <div className="hidden grid-cols-4 gap-4 md:grid">
        {[0, 1, 2, 3].map((i) =>
          photos[i] ? (
            <button
              key={i}
              type="button"
              onClick={() => setShown(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === shown}
              className={`overflow-hidden rounded-card border-2 ${i === shown ? "border-primary" : "border-transparent"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- owners' photos from Supabase storage */}
              <img src={photos[i]} alt="" className="block aspect-[4/3] w-full object-cover" />
            </button>
          ) : (
            <ImagePlaceholder key={i} alt="" aspect="4 / 3" />
          ),
        )}
      </div>
    </div>
  );
}
