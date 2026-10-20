import { describe, expect, it } from "vitest";
import { PAGE_SIZE, chunk, readAll, readByIds } from "./batches";

describe("chunk", () => {
  it("splits into groups of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 100)).toEqual([]);
  });
});

describe("readAll", () => {
  it("keeps reading until a short page comes back", async () => {
    const total = PAGE_SIZE + 5;
    const rows = Array.from({ length: total }, (_, i) => i);
    const calls: [number, number][] = [];
    const result = await readAll(async (from, to) => {
      calls.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    });
    expect(result).toHaveLength(total);
    expect(calls).toEqual([[0, PAGE_SIZE - 1], [PAGE_SIZE, 2 * PAGE_SIZE - 1]]);
  });

  it("passes on query errors", async () => {
    await expect(readAll(async () => ({ data: null, error: new Error("boom") }))).rejects.toThrow("boom");
  });
});

describe("readByIds", () => {
  it("sends at most 100 ids per request and joins the results", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `id-${i}`);
    const sizes: number[] = [];
    const result = await readByIds(ids, async (part) => {
      sizes.push(part.length);
      return { data: part, error: null };
    });
    expect(sizes).toEqual([100, 100, 50]);
    expect(result).toEqual(ids);
  });
});
