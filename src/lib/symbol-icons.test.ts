import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findSymbolIcons } from "./symbol-icons";

describe("findSymbolIcons", () => {
  it("finds emojis and text symbols used as icons", () => {
    expect(findSymbolIcons("Next →\n✓ Free\n★★ 📷 ● ▾ ⟶ ℹ").map((f) => f.symbol)).toEqual(["→", "✓", "★", "★", "📷", "●", "▾", "⟶", "ℹ"]);
  });

  it("gives the line number", () => {
    expect(findSymbolIcons("ok\nok\nBack ←")).toEqual([{ line: 3, symbol: "←" }]);
  });

  it("allows plain text marks", () => {
    expect(findSymbolIcons("3 × Tent · N$650 – Saving… “quoted” N$1,250")).toEqual([]);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe("the web app", () => {
  it("uses SVG icons, not emojis or text symbols", () => {
    // src/lib too: labels and messages shown on screen live there. This file and its test hold the symbols on purpose.
    const found = ["src/app", "src/components", "src/lib"]
      .flatMap(sourceFiles)
      .filter((file) => !/symbol-icons(\.test)?\.ts$/.test(file))
      .flatMap((file) => findSymbolIcons(readFileSync(file, "utf8")).map((f) => `${file}:${f.line} ${f.symbol}`));
    expect(found).toEqual([]);
  });
});
