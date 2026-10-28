import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf-8");
const pkg = JSON.parse(read("package.json"));
const dependabot = read(".github/dependabot.yml");

describe("the automatic dependency updates", () => {
  it("cover the npm packages and the GitHub Actions of the workflows", () => {
    expect(dependabot).toMatch(/package-ecosystem:\s*"?npm"?/);
    expect(dependabot).toMatch(/package-ecosystem:\s*"?github-actions"?/);
  });

  it("send their pull requests to develop, as the branch rules of the repository say", () => {
    const targets = [
      ...dependabot.matchAll(/target-branch:\s*"?([a-z]+)"?/g),
    ].map((m) => m[1]);
    expect(targets).toEqual(["develop", "develop"]);
  });

  it("check once a week", () => {
    expect(
      [...dependabot.matchAll(/interval:\s*"?(\w+)"?/g)].map((m) => m[1]),
    ).toEqual(["weekly", "weekly"]);
  });

  it("group the minor and patch updates only, so that a major update stays a pull request of its own", () => {
    const lists = [
      ...dependabot.matchAll(/update-types:\n((?:[ ]+-[ ]*"\w+"\n)+)/g),
    ].map((m) => [...m[1].matchAll(/"(\w+)"/g)].map((i) => i[1]));
    expect(lists).toEqual([
      ["minor", "patch"],
      ["minor", "patch"],
    ]);
  });

  it("limit how many pull requests are open at once", () => {
    expect(dependabot).toMatch(/open-pull-requests-limit:\s*\d+/);
  });

  it("use the Conventional Commits form for the commit messages", () => {
    expect(dependabot).toMatch(/prefix:\s*"?chore"?/);
  });
});

describe("the checks before a commit", () => {
  it("install themselves when the packages are installed, and never fail an install that has no git", () => {
    expect(pkg.scripts.prepare).toBe("husky || true");
  });

  it("run lint-staged from the pre-commit hook", () => {
    const hook = read(".husky/pre-commit");
    expect(hook).toContain("npx lint-staged");
    expect(statSync(join(root, ".husky/pre-commit")).mode & 0o100).toBeTruthy();
  });

  it("fix the formatting of the staged files and lint the code with no warning allowed", () => {
    const config = pkg["lint-staged"];
    expect(JSON.stringify(config)).toContain("prettier --write");
    expect(JSON.stringify(config)).toContain("eslint --max-warnings=0");
  });

  it("scan every staged file for secrets", () => {
    const config = pkg["lint-staged"];
    expect(config["*"]).toEqual(
      expect.arrayContaining([expect.stringContaining("secretlint")]),
    );
  });

  it("have a secret scanning configuration with the recommended rules", () => {
    const rc = JSON.parse(read(".secretlintrc.json"));
    expect(rc.rules[0].id).toBe("@secretlint/secretlint-rule-preset-recommend");
  });

  it("scan the whole repository with one script", () => {
    expect(pkg.scripts.secrets).toContain("secretlint");
  });

  it("skip what is generated or locked", () => {
    const ignore = read(".secretlintignore");
    for (const entry of [
      "node_modules",
      "out",
      "coverage",
      "package-lock.json",
    ]) {
      expect(ignore, entry).toContain(entry);
    }
  });

  it("exist as files in the repository", () => {
    for (const file of [
      ".husky/pre-commit",
      ".secretlintrc.json",
      ".secretlintignore",
      ".github/dependabot.yml",
    ]) {
      expect(existsSync(join(root, file)), file).toBe(true);
    }
  });

  it("keep the Node type definitions on the major version of the runtime that the repository pins", () => {
    const runtime = read(".nvmrc").trim();
    expect(dependabot).toMatch(
      /dependency-name:\s*"@types\/node"\s*\n\s*update-types:\s*\["version-update:semver-major"\]/,
    );
    expect(pkg.devDependencies["@types/node"]).toMatch(
      new RegExp(`^\\^${runtime}\\.`),
    );
  });
});
