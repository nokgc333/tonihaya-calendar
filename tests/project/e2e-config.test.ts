import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf-8");
const pkg = JSON.parse(read("package.json"));
const ci = read(".github/workflows/ci.yml");
const e2e = ci.slice(ci.indexOf("  e2e:"));
const e2eJob = e2e.slice(
  0,
  e2e.indexOf("\n  lighthouse:") > 0
    ? e2e.indexOf("\n  lighthouse:")
    : undefined,
);
const config = read("playwright.config.ts");

describe("the end-to-end tests", () => {
  it("run with Playwright through one script", () => {
    expect(pkg.scripts["test:e2e"]).toBe("playwright test");
    expect(pkg.devDependencies["@playwright/test"]).toBeDefined();
  });

  it("check accessibility with axe", () => {
    expect(pkg.devDependencies["@axe-core/playwright"]).toBeDefined();
  });

  it("serve the exported site that is deployed, not a development server", () => {
    expect(config).toContain("npm run build");
    expect(config).toContain("scripts/serve-out.mjs");
    expect(config).not.toContain("next dev");
  });

  it("fail in CI when a test is left focused, and retry flaky tests twice", () => {
    expect(config).toContain("forbidOnly: isCI");
    expect(config).toContain("retries: isCI ? 2 : 0");
  });

  it("keep the report and the results out of git, lint and format", () => {
    const ignored = read(".gitignore");
    expect(ignored).toMatch(/^playwright-report\/$/m);
    expect(ignored).toMatch(/^test-results\/$/m);
    expect(read(".prettierignore")).toMatch(/^playwright-report$/m);
  });
});

describe("the CI end-to-end job", () => {
  it("exists and runs the end-to-end script", () => {
    expect(ci).toContain("  e2e:");
    expect(e2eJob).toContain("npm run test:e2e");
  });

  it("has a time limit on the job and on the browser install, which depends on the package mirror", () => {
    expect(e2eJob).toMatch(/timeout-minutes:\s*30/);
    expect(e2eJob).toMatch(
      /Install the browser[\s\S]*?timeout-minutes:\s*20[\s\S]*?npx playwright install --with-deps chromium/,
    );
  });

  it("installs the dependencies the same way as the other jobs", () => {
    expect(e2eJob).toContain("npm install --no-audit --no-fund");
  });

  it("keeps the report as an artifact when a test fails", () => {
    expect(e2eJob).toMatch(
      /if:\s*failure\(\)\s*\n\s*uses:\s*actions\/upload-artifact@v7[\s\S]*?name:\s*playwright-report[\s\S]*?playwright-report\/[\s\S]*?test-results\//,
    );
  });
});
