// One-tap WhatsApp sharing (FR-QT-02) through wa.me links, which open the
// WhatsApp app on a phone and WhatsApp Web on a computer.

/**
 * Turns a phone number as people type it into the international digits
 * wa.me expects. Namibian local numbers (081 123 4567) get the 264 code.
 * Returns null when there are too few digits to be a phone number.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `264${digits.slice(1)}`;
  return digits.length >= 8 ? digits : null;
}

/** A wa.me link with a pre-filled message, to a number or (without one) to a contact the user picks. */
export function whatsAppLink(message: string, phone?: string | null): string {
  const number = toWhatsAppNumber(phone);
  return `https://wa.me/${number ?? ""}?text=${encodeURIComponent(message)}`;
}
