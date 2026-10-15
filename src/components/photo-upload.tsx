"use client";

import { useState } from "react";
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
 * Photo picker for condition photos (FR-CR-01, FR-CR-04) and item photos.
 * Uploads go from the phone straight to Supabase Storage, into `folder`
 * (which starts with the business id, as the storage rules require); the form
 * only sends the saved paths, as hidden fields called `name`. With
 * multiple = false a new photo replaces the previous one.
 */
export function PhotoUpload({
  bucket,
  folder,
  name = "photo",
  label = "Condition photos",
  multiple = true,
  current,
}: {
  bucket: string;
  folder: string;
  name?: string;
  label?: string;
  multiple?: boolean;
  /** The photo already saved, when editing. */
  current?: { path: string; url: string };
}) {
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>(
    current ? [{ path: current.path, preview: current.url }] : [],
  );
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
          const path = `${folder}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, blob, { contentType: "image/jpeg" });
          if (uploadError) throw uploadError;
          const photo = { path, preview: URL.createObjectURL(blob) };
          setPhotos((p) => (multiple ? [...p, photo] : [photo]));
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
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-input bg-card px-4 py-3 text-sm font-medium text-foreground-soft">
        {busy > 0
          ? `Uploading ${busy} photo${busy > 1 ? "s" : ""}…`
          : multiple
            ? "Take or add photos"
            : photos.length
              ? "Change photo"
              : "Take or add a photo"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of an upload
            <img key={p.path} src={p.preview} alt="" className="aspect-square w-full rounded-md object-cover" />
          ))}
        </div>
      )}
      {photos.map((p) => (
        <input key={p.path} type="hidden" name={name} value={p.path} />
      ))}
    </div>
  );
}
