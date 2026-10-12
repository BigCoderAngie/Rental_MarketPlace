import { describe, expect, it } from "vitest";
import { customerSearchFilter } from "./customers";

describe("customer search", () => {
  it("searches name and phone", () => {
    expect(customerSearchFilter(" anna ")).toBe("full_name.ilike.*anna*,phone.ilike.*anna*");
    expect(customerSearchFilter("081")).toBe("full_name.ilike.*081*,phone.ilike.*081*");
  });

  it("drops characters that would change the filter", () => {
    expect(customerSearchFilter("a,b)or(id.eq.1")).toBe("full_name.ilike.*a b or id eq 1*,phone.ilike.*a b or id eq 1*");
  });

  it("shows everyone for an empty search", () => {
    expect(customerSearchFilter("  ")).toBeNull();
    expect(customerSearchFilter(undefined)).toBeNull();
    expect(customerSearchFilter(["a"])).toBeNull();
  });
});
