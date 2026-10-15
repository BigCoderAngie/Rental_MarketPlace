import { describe, expect, it } from "vitest";
import { extraCharges } from "./price-summary";

describe("extra charges", () => {
  it("lists only the charges that apply, with the discount as a minus", () => {
    expect(extraCharges({ delivery_fee: 350, setup_fee: 0, discount: 100 })).toEqual([
      { label: "Delivery", amount: 350 },
      { label: "Discount", amount: 100, minus: true },
    ]);
    expect(extraCharges({ delivery_fee: 0, setup_fee: 0, discount: 0 })).toEqual([]);
  });
});
