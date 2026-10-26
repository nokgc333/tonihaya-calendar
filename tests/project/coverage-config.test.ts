import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf-8");
const pkg = JSON.parse(read("package.json"));
const config = read("vitest.config.ts");
const ci = read(".github/workflows/ci.yml");
const verify = ci.slice(ci.indexOf("  verify:"), ci.indexOf("  lighthouse:"));

const thresholdOf = (name: string): number =>
  Number(new RegExp(`${name}:\\s*(\\d+)`).exec(config)?.[1]);

describe("coverage", () => {
  it("has the V8 provider installed, so that the coverage run can start", () => {
    expect(pkg.devDependencies["@vitest/coverage-v8"]).toBeDefined();
  });

  it("measures every source file, not only the domain", () => {
    expect(config).toContain('include: ["src/**/*.{ts,tsx}"]');
    expect(config).not.toContain('include: ["src/domain/**"]');
  });

  it("leaves out only the tests, the type declarations and the app entry files", () => {
    expect(config).toContain(
      'exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/app/**"]',
    );
  });

  it.each(["statements", "branches", "functions", "lines"])(
    "fails the run when %s coverage drops below the floor of 85%",
    (name) => {
      expect(thresholdOf(name)).toBeGreaterThanOrEqual(85);
    },
  );

  it("has a script that runs the tests with coverage", () => {
    expect(pkg.scripts["test:coverage"]).toBe("vitest run --coverage");
  });

  it("keeps the report out of git, lint and format", () => {
    expect(read(".gitignore")).toMatch(/^coverage\/?$/m);
    expect(read(".prettierignore")).toMatch(/^coverage$/m);
  });
});

describe("the CI coverage run", () => {
  it("runs the tests with coverage, so that a drop fails the pull request", () => {
    expect(verify).toContain("npm run test:coverage");
    expect(verify).not.toMatch(/npm run test\s*$/m);
  });

  it("keeps the report as an artifact even when the threshold fails", () => {
    expect(verify).toMatch(
      /if:\s*\$\{\{\s*!cancelled\(\)\s*\}\}\s*\n\s*uses:\s*actions\/upload-artifact@v7\s*\n\s*with:\s*\n\s*name:\s*coverage\s*\n\s*path:\s*coverage\//,
    );
  });

  it("measures coverage before the build", () => {
    expect(verify.indexOf("npm run test:coverage")).toBeLessThan(
      verify.indexOf("npm run build"),
    );
  });
});
