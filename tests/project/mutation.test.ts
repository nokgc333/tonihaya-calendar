import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");
const stryker = JSON.parse(read("stryker.config.json"));
const pkg = JSON.parse(read("package.json"));
const workflow = read(".github/workflows/mutation.yml");

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

describe("the weekly mutation workflow", () => {
  it("runs every week and on request, not on every push, because a run takes a quarter of an hour", () => {
    expect(workflow).toMatch(/schedule:\s*\n\s*-\s*cron:\s*"[^"]+"/);
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toMatch(/\n\s*push:/);
    expect(workflow).not.toMatch(/\n\s*pull_request:/);
  });

  it("runs the script and has a time limit", () => {
    expect(workflow).toContain("npm run test:mutation");
    expect(workflow).toMatch(/timeout-minutes:\s*\d+/);
  });

  it("keeps the report, even when the score is too low", () => {
    expect(workflow).toMatch(
      /if:\s*\$\{\{\s*!cancelled\(\)\s*\}\}[\s\S]*upload-artifact@v7[\s\S]*reports\/mutation\//,
    );
  });

  it("only reads the repository", () => {
    expect(workflow).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });
});
