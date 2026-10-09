"use client";

import { useState } from "react";
import { PHOTO_BUCKET, photoPath } from "@/lib/handovers";
import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1600;

// Shrinks a phone photo to at most 1600px on its longest side as a JPEG, so
// uploads are quick on mobile data. Falls back to the original file.
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.8),
    );
  } catch {
    return file;
  }
}

/**
 * Condition photos (FR-CR-01, FR-CR-04). Uploads go from the phone straight
 * to Supabase Storage; the form only sends the saved paths, as hidden
 * "photo" fields.
 */
export function PhotoUpload({ businessId, bookingId }: { businessId: string; bookingId: string }) {
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string>();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(undefined);
    const supabase = createClient();
    await Promise.all(
      [...files].map(async (file) => {
        setBusy((n) => n + 1);
        try {
          const blob = await shrink(file);
          const path = photoPath(businessId, bookingId, crypto.randomUUID());
          const { error: uploadError } = await supabase.storage
            .from(PHOTO_BUCKET)
            .upload(path, blob, { contentType: "image/jpeg" });
          if (uploadError) throw uploadError;
          setPhotos((p) => [...p, { path, preview: URL.createObjectURL(blob) }]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "A photo did not upload. Try again.");
        } finally {
          setBusy((n) => n - 1);
        }
      }),
    );
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">Condition photos</span>
      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-400 bg-white px-4 py-3 text-sm font-medium text-zinc-700">
        {busy > 0 ? `Uploading ${busy} photo${busy > 1 ? "s" : ""}…` : "Take or add photos"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of an upload
            <img key={p.path} src={p.preview} alt="" className="aspect-square w-full rounded-md object-cover" />
          ))}
        </div>
      )}
      {photos.map((p) => (
        <input key={p.path} type="hidden" name="photo" value={p.path} />
      ))}
    </div>
  );
}
