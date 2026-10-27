import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const components = join(root, "src/components");
const read = (file: string) => readFileSync(join(root, file), "utf-8");

const entries = readdirSync(components);
const folders = entries.filter((e) =>
  statSync(join(components, e)).isDirectory(),
);

const sourceFiles = (folder: string): string[] =>
  readdirSync(join(components, folder))
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))
    .map((f) => join(components, folder, f));

const importedFolders = (file: string): string[] =>
  [
    ...readFileSync(file, "utf-8").matchAll(/from "@\/components\/([a-z]+)\//g),
  ].map((m) => m[1]);

const ALLOWED: Readonly<Record<string, readonly string[]>> = {
  common: [],
  timeline: ["common", "event"],
  event: ["common"],
  month: ["common", "event", "calendar"],
  week: ["common", "event", "calendar", "timeline"],
  day: ["common", "event", "calendar", "timeline"],
  year: ["common", "event", "calendar", "month"],
  calendar: ["common", "event", "year", "month", "week", "day", "timeline"],
};

describe("the folders of the components", () => {
  it("leave no more than five files directly in components", () => {
    const files = entries.filter(
      (e) => !statSync(join(components, e)).isDirectory(),
    );
    expect(files.length).toBeLessThanOrEqual(5);
  });

  it("are the feature folders, and each one holds a component", () => {
    expect(folders.sort()).toEqual(Object.keys(ALLOWED).sort());
    for (const folder of folders) {
      expect(
        sourceFiles(folder).some((f) => f.endsWith(".tsx")),
        folder,
      ).toBe(true);
    }
  });

  it.each(Object.entries(ALLOWED))(
    "let %s depend only on %j",
    (folder, allowed) => {
      for (const file of sourceFiles(folder)) {
        for (const used of importedFolders(file)) {
          if (used === folder) continue;
          expect(allowed, `${file} uses ${used}`).toContain(used);
        }
      }
    },
  );

  it("keep each test next to the file it tests", () => {
    for (const folder of folders) {
      const files = readdirSync(join(components, folder));
      for (const test of files.filter((f) => /\.test\.tsx?$/.test(f))) {
        const stem = test.replace(/\.test\.tsx?$/, "");
        const owners = files.filter(
          (f) => !/\.test\./.test(f) && f.startsWith(`${stem}.`),
        );
        const known = [
          "monthCardKeyboard",
          "eventModalFields",
          "themeVariables",
        ];
        expect(
          owners.length > 0 || known.includes(stem),
          `${folder}/${test}`,
        ).toBe(true);
      }
    }
  });
});

describe("the duplicate check", () => {
  const config = JSON.parse(read(".jscpd.json"));
  const pkg = JSON.parse(read("package.json"));
  const ci = read(".github/workflows/ci.yml");

  it("accepts no duplicated block in the source, with the tests, the property tests and the style sheet left out", () => {
    expect(config.threshold).toBe(0);
    expect(config.path).toEqual(["src"]);
    expect(config.ignore).toEqual(
      expect.arrayContaining([
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/properties/**",
        "**/*.css",
      ]),
    );
  });

  it("runs through one script", () => {
    expect(pkg.scripts["check:duplicates"]).toBe("jscpd");
  });

  it("runs in CI before the build", () => {
    const verify = ci.slice(ci.indexOf("  verify:"), ci.indexOf("  e2e:"));
    expect(verify).toContain("npm run check:duplicates");
    expect(verify.indexOf("npm run check:duplicates")).toBeLessThan(
      verify.indexOf("npm run build"),
    );
  });
});
