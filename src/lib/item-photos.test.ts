import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { itemPhotoFolder, itemPhotoUrl } from "./item-photos";

const fakeClient = {
  storage: {
    from: (bucket: string) => ({
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://x.test/${bucket}/${path}` } }),
    }),
  },
} as unknown as SupabaseClient;

describe("item photos", () => {
  it("keeps photos in the business folder", () => {
    expect(itemPhotoFolder("biz")).toBe("biz/items");
  });

  it("builds the public address, or null without a photo", () => {
    expect(itemPhotoUrl(fakeClient, "biz/items/a.jpg")).toBe("https://x.test/item-photos/biz/items/a.jpg");
    expect(itemPhotoUrl(fakeClient, null)).toBeNull();
  });
});
