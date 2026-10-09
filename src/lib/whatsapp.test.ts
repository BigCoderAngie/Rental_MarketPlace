import { describe, expect, it } from "vitest";
import { toWhatsAppNumber, whatsAppLink } from "./whatsapp";

describe("WhatsApp numbers", () => {
  it("adds the Namibian code to local numbers", () => {
    expect(toWhatsAppNumber("081 123 4567")).toBe("264811234567");
  });

  it("keeps international numbers", () => {
    expect(toWhatsAppNumber("+264 81 123 4567")).toBe("264811234567");
    expect(toWhatsAppNumber("00264811234567")).toBe("264811234567");
    expect(toWhatsAppNumber("+27 82 555 0000")).toBe("27825550000");
  });

  it("rejects things that are not phone numbers", () => {
    expect(toWhatsAppNumber("")).toBeNull();
    expect(toWhatsAppNumber("123")).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
  });
});

describe("WhatsApp links", () => {
  it("pre-fills the message for a number", () => {
    expect(whatsAppLink("Hi & welcome", "0811234567")).toBe("https://wa.me/264811234567?text=Hi%20%26%20welcome");
  });

  it("lets the sender pick a contact when there is no number", () => {
    expect(whatsAppLink("Hi")).toBe("https://wa.me/?text=Hi");
  });
});
