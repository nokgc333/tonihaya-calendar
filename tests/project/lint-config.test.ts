import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf-8");
const pkg = JSON.parse(read("package.json"));
const config = read("eslint.config.mjs");

const CURRENT_WARNINGS = 4;

describe("lint", () => {
  it("runs the ESLint command line without prompting, instead of the deprecated next lint", () => {
    expect(pkg.scripts.lint).toMatch(/^eslint \./);
    expect(pkg.scripts.lint).not.toContain("next lint");
  });

  it("uses the Next.js rules, including the React hooks rules", () => {
    expect(config).toContain("next/core-web-vitals");
    expect(config).toContain("next/typescript");
  });

  it.each([
    ["complexity", /complexity:\s*\["(warn|error)",\s*10\]/],
    [
      "function length",
      /"max-lines-per-function":\s*\[\s*"(warn|error)",\s*\{\s*max:\s*80/,
    ],
    ["file length", /"max-lines":\s*\["(warn|error)",\s*300\]/],
    ["parameter count", /"max-params":\s*\["(warn|error)",\s*4\]/],
    ["nesting depth", /"max-depth":\s*\["(warn|error)",\s*4\]/],
  ])("limits the %s", (_name, pattern) => {
    expect(config).toMatch(pattern);
  });

  it("reports a directive comment that no longer disables anything", () => {
    expect(config).toMatch(/reportUnusedDisableDirectives:\s*"error"/);
  });

  it("does not let the number of size and complexity warnings grow", () => {
    const ceiling = Number(
      /--max-warnings[= ](\d+)/.exec(pkg.scripts.lint)?.[1],
    );

    expect(ceiling).toBeLessThanOrEqual(CURRENT_WARNINGS);
  });
});

describe("format", () => {
  it("has a format command and a check command", () => {
    expect(pkg.scripts.format).toBe("prettier --write .");
    expect(pkg.scripts["format:check"]).toBe("prettier --check .");
  });

  it("orders the Tailwind classes by the stylesheet of the app, because Tailwind 4 has no config file", () => {
    const rc = JSON.parse(read(".prettierrc.json"));

    expect(rc.plugins).toContain("prettier-plugin-tailwindcss");
    expect(rc.tailwindStylesheet).toBe("./src/app/globals.css");
  });

  it("leaves generated output, the lock file and hand-written documents alone", () => {
    const ignore = read(".prettierignore").split("\n");

    for (const entry of [
      ".next",
      "out",
      "node_modules",
      "package-lock.json",
      "docs",
    ]) {
      expect(ignore, entry).toContain(entry);
    }
  });

  it("has a check script that runs every quick check, lightest first", () => {
    expect(pkg.scripts.check).toBe(
      "npm run lint && npm run type-check && npm run format:check && npm run test",
    );
  });
});

describe("the CI", () => {
  const ci = read(".github/workflows/ci.yml");
  const verify = ci.slice(ci.indexOf("  verify:"), ci.indexOf("  lighthouse:"));

  it("fails a pull request that breaks the lint rules", () => {
    expect(verify).toContain("npm run lint");
  });

  it("fails a pull request whose code is not formatted", () => {
    expect(verify).toContain("npm run format:check");
  });

  it("runs the cheap checks before the build", () => {
    expect(verify.indexOf("npm run lint")).toBeLessThan(
      verify.indexOf("npm run build"),
    );
    expect(verify.indexOf("npm run format:check")).toBeLessThan(
      verify.indexOf("npm run build"),
    );
  });
});
