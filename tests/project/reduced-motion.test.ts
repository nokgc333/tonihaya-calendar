import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

const reducedBlocks = [
  ...css.matchAll(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/g,
  ),
].map((m) => m[1]);
const reduced = reducedBlocks.join("\n");

describe("the reduced motion setting", () => {
  it("makes the animations and transitions of every element instant", () => {
    expect(reduced).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(reduced).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("switches off the view transition animations, which the rule above cannot reach", () => {
    for (const part of ["group", "old", "new"]) {
      expect(reduced, part).toContain(`::view-transition-${part}(*)`);
    }
    expect(reduced).toMatch(/animation:\s*none\s*!important/);
  });

  it("covers every view transition name that the app animates", () => {
    const animated = new Set(
      [
        ...css.matchAll(/::view-transition-(?:group|old|new)\(([a-z-]+)\)/g),
      ].map((m) => m[1]),
    );
    expect(animated.size).toBeGreaterThan(0);
    expect(reduced).toContain("::view-transition-group(*)");
  });
});
