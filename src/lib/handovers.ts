// Checkout and return records (SRS 5.8).

export type HandoverKind = "CHECKOUT" | "RETURN";

export type HandoverLine = {
  item_id: string;
  quantity: number;
  damaged: number;
  missing: number;
  items: { name: string } | null;
};

export type Handover = {
  id: string;
  kind: HandoverKind;
  id_checked: boolean;
  late: boolean;
  note: string | null;
  recorded_at: string;
  customer_confirmed_at: string | null;
  customer_disputed_at: string | null;
  dispute_note: string | null;
  handover_lines: HandoverLine[];
  handover_photos: { id: string; storage_path: string }[];
};

/** What get_public_handovers() returns for the customer's booking page. */
export type PublicHandover = {
  id: string;
  kind: HandoverKind;
  recorded_at: string;
  late: boolean;
  note: string | null;
  photo_count: number;
  customer_confirmed_at: string | null;
  customer_disputed_at: string | null;
  dispute_note: string | null;
  lines: { name: string; quantity: number; damaged: number; missing: number }[];
};

export const PHOTO_BUCKET = "handover-photos";

/** Folder for a booking's condition photos: the business folder first, which storage rules check. */
export function handoverPhotoFolder(businessId: string, bookingId: string): string {
  return `${businessId}/${bookingId}`;
}

/** Return counts read from a form, per item: fine, damaged and missing. */
export function readReturnLines(formData: FormData) {
  const ids = new Set(
    [...formData.keys()].filter((k) => k.startsWith("fine:")).map((k) => k.slice(5)),
  );
  return [...ids].map((item_id) => ({
    item_id,
    quantity: Number(formData.get(`fine:${item_id}`) || 0),
    damaged: Number(formData.get(`damaged:${item_id}`) || 0),
    missing: Number(formData.get(`missing:${item_id}`) || 0),
  }));
}

/** One line summary of a return line, e.g. "18 fine, 1 damaged, 1 missing". */
export function describeReturn(l: { quantity: number; damaged: number; missing: number }): string {
  const parts = [`${l.quantity} fine`];
  if (l.damaged) parts.push(`${l.damaged} damaged`);
  if (l.missing) parts.push(`${l.missing} missing`);
  return parts.join(", ");
}
