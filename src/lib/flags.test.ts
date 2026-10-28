import { afterEach, describe, expect, it, vi } from "vitest";
import { isOn } from "./flags";

describe("isOn", () => {
  it("is on only for the word on", () => {
    expect(isOn("on")).toBe(true);
    expect(isOn(" ON ")).toBe(true);
    expect(isOn("off")).toBe(false);
    expect(isOn("true")).toBe(false);
    expect(isOn("")).toBe(false);
    expect(isOn(undefined)).toBe(false);
  });
});

describe("flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadFlags() {
    vi.resetModules();
    return (await import("./flags")).flags;
  }

  it("reads on from the environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN", "on");
    expect((await loadFlags()).googleSignIn).toBe(true);
  });

  it("is off when set to off", async () => {
    vi.stubEnv("NEXT_PUBLIC_FLAG_GOOGLE_SIGNIN", "off");
    expect((await loadFlags()).googleSignIn).toBe(false);
  });

  it("is off when missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_FLAG_NOTIFICATIONS", undefined);
    expect((await loadFlags()).notifications).toBe(false);
  });
});
