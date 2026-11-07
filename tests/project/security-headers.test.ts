import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const config = JSON.parse(
  readFileSync(join(process.cwd(), "vercel.json"), "utf-8"),
);
const entry = config.headers.find(
  (h: { source: string }) => h.source === "/(.*)",
);
const headers = Object.fromEntries(
  entry.headers.map((h: { key: string; value: string }) => [
    h.key.toLowerCase(),
    h.value,
  ]),
) as Record<string, string>;

const directives = (policy: string): Record<string, string[]> =>
  Object.fromEntries(
    policy
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0])
      .map(([name, ...values]) => [name, values]),
  );

const csp = directives(headers["content-security-policy"]);

describe("the security headers in vercel.json", () => {
  it("apply to every path, with one rule", () => {
    expect(config.headers).toHaveLength(1);
    expect(entry.source).toBe("/(.*)");
  });

  it("forbid inline scripts and eval, and allow only scripts from the site itself", () => {
    expect(csp["script-src"]).toEqual(["'self'"]);
  });

  it("do not let any directive that governs scripts fall back to something looser", () => {
    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["script-src-elem"]).toBeUndefined();
    expect(csp["script-src-attr"]).toBeUndefined();
  });

  it("allow inline styles only, because React writes style attributes, and nothing from other sites", () => {
    expect(csp["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it("allow images only from the site and data URLs, fonts only from the site", () => {
    expect(csp["img-src"]).toEqual(["'self'", "data:"]);
    expect(csp["font-src"]).toEqual(["'self'"]);
  });

  it("allow requests only to the site and to the performance measurement service", () => {
    expect(csp["connect-src"]).toEqual([
      "'self'",
      "https://vitals.vercel-insights.com",
    ]);
  });

  it("forbid plugins, a changed base URL, framing and form posts to other sites", () => {
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
    expect(csp["frame-ancestors"]).toEqual(["'none'"]);
    expect(csp["form-action"]).toEqual(["'self'"]);
  });

  it("never allow a wildcard or an http source", () => {
    for (const [name, values] of Object.entries(csp)) {
      for (const value of values) {
        expect(value, name).not.toBe("*");
        expect(value, name).not.toMatch(/^http:/);
      }
    }
  });

  it("isolate the window from other sites and keep other sites from loading the resources", () => {
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
  });

  it("keep the older headers that other protections rely on", () => {
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toMatch(/max-age=63072000/);
    expect(headers["permissions-policy"]).toContain("camera=()");
  });
});

describe("the build", () => {
  it("moves the inline scripts out of the pages after the export, so that the policy can forbid them", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8"),
    );
    expect(pkg.scripts.build).toBe(
      "next build && node scripts/externalize-inline-scripts.mjs",
    );
  });
});
