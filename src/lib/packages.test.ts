import { describe, expect, it } from "vitest";
import { packageContents, packagesFree, readPackageLines } from "./packages";

const wedding = {
  package_items: [
    { item_id: "chair", quantity: 100, items: { name: "Chair" } },
    { item_id: "tent", quantity: 1, items: { name: "Tent" } },
  ],
};

describe("packages", () => {
  it("reads package quantities from a form", () => {
    const form = new FormData();
    form.set("pkg:a", "2");
    form.set("pkg:b", "0");
    form.set("qty:c", "5");
    expect(readPackageLines(form)).toEqual([{ package_id: "a", quantity: 2 }]);
  });

  it("counts whole packages that fit in what is free", () => {
    expect(packagesFree(wedding, new Map([["chair", 250], ["tent", 3]]))).toBe(2);
    expect(packagesFree(wedding, new Map([["chair", 250]]))).toBe(0);
  });

  it("lists what is in a package", () => {
    expect(packageContents(wedding)).toBe("100 × Chair, 1 × Tent");
  });
});
