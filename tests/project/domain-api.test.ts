import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const doc = readFileSync(join(root, "docs/domain-api.md"), "utf-8");

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(join(root, path)).isDirectory()) {
      return entry === "properties" ? [] : sourceFiles(path);
    }
    const isSource = /\.ts$/.test(entry) && !/\.test\.ts$/.test(entry);
    return isSource && !["index.ts", "types.ts"].includes(entry) ? [path] : [];
  });
}

const exported = sourceFiles("src/domain").flatMap((file) =>
  [
    ...readFileSync(join(root, file), "utf-8").matchAll(
      /^export (?:function|const|class) ([A-Za-z0-9_]+)/gm,
    ),
  ].map((m) => ({ file, name: m[1] })),
);

describe("the list of the public functions of the domain layer", () => {
  it("has found the exports to check", () => {
    expect(exported.length).toBeGreaterThan(40);
  });

  it.each(exported.map((e) => [e.name, e.file]))(
    "describes %s (%s)",
    (name) => {
      expect(doc).toContain(`\`${name}`);
    },
  );

  it("names no function that does not exist", () => {
    const known = new Set(exported.map((e) => e.name));
    const mentioned = [
      ...doc.matchAll(/^\| `([A-Za-z0-9_]+)(?:\(| \/|`)/gm),
    ].map((m) => m[1]);
    for (const name of mentioned) expect(known.has(name), name).toBe(true);
  });

  it("is linked from the README", () => {
    expect(readFileSync(join(root, "README.md"), "utf-8")).toContain(
      "./docs/domain-api.md",
    );
  });
});
