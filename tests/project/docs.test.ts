import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf-8");
const pkg = JSON.parse(read("package.json"));
const readme = read("README.md");
const checklist = read("docs/deploy-checklist.md");

const INTERNAL_SCRIPTS = ["prepare", "start", "test:watch"];

describe("the README", () => {
  it("names every npm script that a person runs", () => {
    for (const name of Object.keys(pkg.scripts)) {
      if (INTERNAL_SCRIPTS.includes(name)) continue;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mention = new RegExp(
        `(?:npm run |npm |/ \`?)${escaped}(?![\\w:-])`,
      );
      expect(readme, name).toMatch(mention);
    }
  });

  it("gives the Node version that the repository pins", () => {
    const major = read(".nvmrc").trim();
    expect(readme).toContain(`Node.js ${major}`);
    expect(pkg.engines.node).toBe(`>=${major}`);
  });

  it("links to the deployment checklist, which exists", () => {
    expect(readme).toContain("./docs/deploy-checklist.md");
    expect(existsSync(join(root, "docs/deploy-checklist.md"))).toBe(true);
  });

  it("describes the real state of the project, not the early plan", () => {
    expect(readme).not.toContain("要件定義・仕様策定フェーズ");
    expect(readme).toContain("https://tonihaya-calendar.vercel.app");
  });

  it("lists the storage keys that the data layer uses", () => {
    const repository = read("src/data/localStorageEventRepository.ts");
    for (const key of [
      "tonihaya.events.legacy-v0",
      "tonihaya.events.backup",
      "tonihaya.events.rejected",
    ]) {
      expect(readme, key).toContain(key);
    }
    expect(repository).toContain('"tonihaya.events"');
  });

  it("lists the feature folders of the components, and only those", () => {
    const line = /components\/\s+機能ごとのフォルダ: ([^\n]+)/.exec(readme)![1];
    const named = line.split("、").map((s) => s.trim());
    const folders = readdirFolders("src/components");
    expect(named.sort()).toEqual(folders.sort());
  });
});

function readdirFolders(dir: string): string[] {
  return readdirSync(join(root, dir)).filter((e) =>
    statSync(join(root, dir, e)).isDirectory(),
  );
}

describe("the deployment checklist", () => {
  it("uses the scripts that check a deployed site", () => {
    for (const script of ["check:headers", "check:site", "lighthouse"]) {
      expect(checklist, script).toContain(script);
      expect(pkg.scripts[script], script).toBeDefined();
    }
  });

  it("says how to go back, and why the previews are not checked by a script", () => {
    expect(checklist).toContain("git revert -m 1");
    expect(checklist).toContain("SSO");
  });

  it("states the thresholds of the performance check", () => {
    expect(checklist).toMatch(/性能 90 以上/);
    expect(checklist).toMatch(/CLS 0\.05 以下/);
  });
});

describe("CLAUDE.md", () => {
  it("tells to update the README together with a change, and when raising the version", () => {
    const rules = read("CLAUDE.md");
    expect(rules).toContain("同じ PR で `README.md` も更新する");
    expect(rules).toContain("`version`");
  });
});
