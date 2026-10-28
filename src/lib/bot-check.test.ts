import { describe, expect, it } from "vitest";
import { BOT_CHECK_FIELD, botCheckSiteKey, captchaOption, isBotCheckError } from "./bot-check";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

describe("botCheckSiteKey", () => {
  it("gives the key only when the flag is on and a key is set", () => {
    expect(botCheckSiteKey(true, " 0x4AAA ")).toBe("0x4AAA");
    expect(botCheckSiteKey(false, "0x4AAA")).toBeNull();
    expect(botCheckSiteKey(true, "")).toBeNull();
    expect(botCheckSiteKey(true, undefined)).toBeNull();
  });
});

describe("captchaOption", () => {
  it("passes the token on", () => {
    expect(captchaOption(form({ [BOT_CHECK_FIELD]: "token-1" }))).toEqual({ captchaToken: "token-1" });
  });

  it("adds nothing when there is no token", () => {
    expect(captchaOption(form({}))).toEqual({});
    expect(captchaOption(form({ [BOT_CHECK_FIELD]: " " }))).toEqual({});
  });
});

describe("isBotCheckError", () => {
  it("spots Supabase's captcha error only", () => {
    expect(isBotCheckError({ code: "captcha_failed" })).toBe(true);
    expect(isBotCheckError({ code: "invalid_credentials" })).toBe(false);
    expect(isBotCheckError(null)).toBe(false);
  });
});
