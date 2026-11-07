import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");
const stryker = JSON.parse(read("stryker.config.json"));
const pkg = JSON.parse(read("package.json"));

describe("the mutation testing", () => {
  it("runs through one script, with the Vitest runner", () => {
    expect(pkg.scripts["test:mutation"]).toBe("stryker run");
    expect(stryker.testRunner).toBe("vitest");
    expect(pkg.devDependencies["@stryker-mutator/vitest-runner"]).toBeDefined();
  });

  it("mutates the domain layer only, and not its tests, indexes, type files or the generators of the property tests", () => {
    expect(stryker.mutate).toEqual([
      "src/domain/**/*.ts",
      "!src/domain/**/*.test.ts",
      "!src/domain/**/index.ts",
      "!src/domain/**/types.ts",
      "!src/domain/properties/**",
    ]);
  });

  it("fails below a score of 85, as the task requires, and calls 90 high", () => {
    expect(stryker.thresholds.break).toBe(85);
    expect(stryker.thresholds.high).toBeGreaterThanOrEqual(90);
  });

  it("keeps its report and temporary files out of git, lint and format", () => {
    expect(read(".gitignore")).toMatch(/^reports\/$/m);
    expect(read(".gitignore")).toMatch(/^\.stryker-tmp\/$/m);
    expect(read(".prettierignore")).toMatch(/^reports$/m);
  });
});
