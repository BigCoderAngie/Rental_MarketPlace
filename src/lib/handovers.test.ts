import { describe, expect, it } from "vitest";
import { describeReturn, handoverPhotoFolder, readReturnLines } from "./handovers";

describe("handovers", () => {
  it("reads return counts per item", () => {
    const form = new FormData();
    form.set("fine:a", "18");
    form.set("damaged:a", "1");
    form.set("missing:a", "1");
    form.set("fine:b", "2");
    expect(readReturnLines(form)).toEqual([
      { item_id: "a", quantity: 18, damaged: 1, missing: 1 },
      { item_id: "b", quantity: 2, damaged: 0, missing: 0 },
    ]);
  });

  it("describes a return line", () => {
    expect(describeReturn({ quantity: 18, damaged: 1, missing: 1 })).toBe("18 fine, 1 damaged, 1 missing");
    expect(describeReturn({ quantity: 2, damaged: 0, missing: 0 })).toBe("2 fine");
  });

  it("puts photos in the business folder first", () => {
    expect(handoverPhotoFolder("biz", "bk")).toBe("biz/bk");
  });
});
