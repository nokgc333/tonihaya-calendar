import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");
const ci = read(".github/workflows/ci.yml");
const codeql = read(".github/workflows/codeql.yml");

const job = (name: string): string => {
  const start = ci.indexOf(`  ${name}:`);
  expect(start, `job ${name}`).toBeGreaterThan(-1);
  const rest = ci.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next < 0 ? rest : rest.slice(0, next);
};

describe("the dependency audit job", () => {
  const audit = job("audit");

  it("fails on a high or critical vulnerability in what ships to users", () => {
    expect(audit).toContain("npm audit --omit=dev --audit-level=high");
  });

  it("has a time limit", () => {
    expect(audit).toMatch(/timeout-minutes:\s*\d+/);
  });

  it("installs nothing, because the audit reads the lock file", () => {
    expect(audit).not.toContain("npm install");
    expect(audit).not.toContain("npm ci");
  });
});

describe("the dependency review job", () => {
  const review = job("dependency-review");

  it("runs only on pull requests, where there is a change to review", () => {
    expect(review).toMatch(/if:\s*github\.event_name == 'pull_request'/);
  });

  it("fails a pull request that adds a dependency with a high severity vulnerability", () => {
    expect(review).toContain("actions/dependency-review-action@v5");
    expect(review).toMatch(/fail-on-severity:\s*high/);
  });

  it("only reads the repository", () => {
    expect(review).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });
});

describe("the CodeQL workflow", () => {
  it("scans on pushes and pull requests to the long-lived branches, and on a weekly schedule", () => {
    expect(codeql).toMatch(/branches:\s*\[develop,\s*main\]/);
    expect(codeql).toContain("schedule:");
    expect(codeql).toMatch(/cron:\s*"[^"]+"/);
  });

  it("analyzes the JavaScript and TypeScript code without building it", () => {
    expect(codeql).toContain("languages: javascript-typescript");
    expect(codeql).toContain("build-mode: none");
    expect(codeql).toContain("github/codeql-action/init@v4");
    expect(codeql).toContain("github/codeql-action/analyze@v4");
  });

  it("may write only the security results, and read the rest", () => {
    expect(codeql).toMatch(/security-events:\s*write/);
    expect(codeql).toMatch(/contents:\s*read/);
    expect(codeql).not.toMatch(/contents:\s*write/);
  });

  it("has a time limit", () => {
    expect(codeql).toMatch(/timeout-minutes:\s*\d+/);
  });
});

describe("the CI workflow", () => {
  it("cancels a run that a newer push makes obsolete", () => {
    expect(ci).toMatch(
      /concurrency:\s*\n\s*group:\s*ci-\$\{\{ github\.ref \}\}\s*\n\s*cancel-in-progress:\s*true/,
    );
  });

  it("pins every action to a major version, not to a moving branch", () => {
    for (const [, ref] of `${ci}\n${codeql}`.matchAll(
      /uses:\s*[^@\s]+@(\S+)/g,
    )) {
      expect(ref).toMatch(/^v\d+$/);
    }
  });
});
