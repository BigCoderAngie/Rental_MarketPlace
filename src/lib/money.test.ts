import { describe, expect, it } from "vitest";
import { formatNad, formatNadWhole } from "./money";

describe("formatNad", () => {
  it("shows cents and thousands separators", () => {
    expect(formatNad(1250)).toBe("N$1,250.00");
    expect(formatNad("99.5")).toBe("N$99.50");
  });
});

describe("formatNadWhole", () => {
  it("shows whole dollars with thousands separators", () => {
    expect(formatNadWhole(650)).toBe("N$650");
    expect(formatNadWhole(6500)).toBe("N$6,500");
    expect(formatNadWhole(219.6)).toBe("N$220");
  });
});
