import { describe, expect, it } from "vitest";

import { findProblems } from "../../scripts/check-site.mjs";

const healthy = {
  months: 12,
  dialogOpened: true,
  cspViolations: [],
  pageErrors: [],
  inlineScripts: 0,
  canonical: "https://example.com",
  ogImage: "https://example.com/og.png",
  manifest: "/manifest.webmanifest",
  jsonLd: 1,
  files: [
    { path: "/robots.txt", status: 200, type: "text/plain; charset=utf-8" },
    { path: "/og.png", status: 200, type: "image/png" },
  ],
};

describe("findProblems", () => {
  it("finds nothing wrong with a healthy site", () => {
    expect(findProblems(healthy)).toEqual([]);
  });

  it("reports a year view that does not show twelve months, which is what a blocked script looks like", () => {
    expect(findProblems({ ...healthy, months: 0 })).toEqual([
      "the year view shows 0 months, not 12",
    ]);
  });

  it("reports that the event form did not open", () => {
    expect(findProblems({ ...healthy, dialogOpened: false })).toContain(
      "the event form did not open",
    );
  });

  it("reports each policy violation with what was blocked", () => {
    const problems = findProblems({
      ...healthy,
      cspViolations: ["script-src-elem inline"],
    });
    expect(problems).toEqual(["policy violation: script-src-elem inline"]);
  });

  it("reports each error of the page", () => {
    expect(findProblems({ ...healthy, pageErrors: ["console: boom"] })).toEqual(
      ["page error: console: boom"],
    );
  });

  it("reports inline scripts, which the policy would block", () => {
    expect(findProblems({ ...healthy, inlineScripts: 2 })).toEqual([
      "the page has 2 inline scripts",
    ]);
  });

  it.each(["canonical", "ogImage", "manifest"] as const)(
    "reports a missing %s",
    (field) => {
      expect(findProblems({ ...healthy, [field]: null })).toEqual([
        `${field} is missing`,
      ]);
    },
  );

  it("reports missing structured data", () => {
    expect(findProblems({ ...healthy, jsonLd: 0 })).toEqual([
      "structured data is missing",
    ]);
  });

  it("reports a file that is not served, with its status", () => {
    const problems = findProblems({
      ...healthy,
      files: [{ path: "/og.png", status: 404, type: "text/html" }],
    });
    expect(problems).toEqual(["/og.png answered 404 (text/html)"]);
  });

  it("reports several problems together, in a fixed order", () => {
    const problems = findProblems({
      ...healthy,
      months: 3,
      inlineScripts: 1,
      canonical: null,
    });
    expect(problems).toEqual([
      "the year view shows 3 months, not 12",
      "the page has 1 inline scripts",
      "canonical is missing",
    ]);
  });
});
