"use client";

import { useState } from "react";
import { ITEM_PHOTO_BUCKET, itemPhotoFolder } from "@/lib/item-photos";
import { MAX_PHOTOS } from "@/lib/listing";
import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1600;

// Shrinks a phone photo to at most 1600px on its longest side, as photo-upload.tsx does.
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.8));
  } catch {
    return file;
  }
}

export type UploadedPhoto = { path: string; preview: string };

/**
 * "Add photos" (SiteList.html): real uploads from the phone straight to
 * storage, the first one marked Cover, up to five, and an Add tile. The
 * owner's business is made on the first upload so photos have a folder.
 * Each photo goes to the form as a hidden "photo" field.
 */
export function ListingPhotos({ photos, onChange, error }: { photos: UploadedPhoto[]; onChange: (p: UploadedPhoto[]) => void; error?: string }) {
  const [busy, setBusy] = useState(0);
  const [problem, setProblem] = useState<string>();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setProblem(undefined);
    const supabase = createClient();
    const { data: businessId, error: businessError } = await supabase.rpc("ensure_owner_business");
    if (businessError) {
      setProblem(businessError.message);
      return;
    }
    const room = MAX_PHOTOS - photos.length;
    const added: UploadedPhoto[] = [];
    for (const file of [...files].slice(0, room)) {
      setBusy((n) => n + 1);
      try {
        const blob = await shrink(file);
        const path = `${itemPhotoFolder(businessId as string)}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from(ITEM_PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        added.push({ path, preview: URL.createObjectURL(blob) });
      } catch (e) {
        setProblem(e instanceof Error ? e.message : "A photo did not upload. Try again.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    onChange([...photos, ...added]);
  }

  function makeCover(i: number) {
    const next = [...photos];
    const [picked] = next.splice(i, 1);
    onChange([picked!, ...next]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        {photos.map((p, i) => (
          <div key={p.path} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an upload */}
            <img src={p.preview} alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`} className="aspect-square w-full rounded-btn object-cover" />
            {i === 0 ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-card px-2 py-0.5 text-xs font-bold">Cover</span>
            ) : (
              <button type="button" onClick={() => makeCover(i)} className="absolute bottom-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary">
                Make cover
              </button>
            )}
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary"
            >
              ×
            </button>
            <input type="hidden" name="photo" value={p.path} />
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-btn border-2 border-dashed border-primary-border font-bold text-primary has-focus-visible:outline-2 has-focus-visible:outline-primary">
            <span aria-hidden className="text-3xl leading-none">
              +
            </span>
            {busy > 0 ? "Uploading…" : "Add"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {(problem || error) && <p className="text-[13px] font-medium text-danger">{problem ?? error}</p>}
    </div>
  );
}
