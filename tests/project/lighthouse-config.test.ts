import { createRequire } from "node:module";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const config = require(join(process.cwd(), ".lighthouserc.cjs"));
const assertions = config.ci.assert.assertions as Record<
  string,
  [string, Record<string, number>]
>;

describe("the Lighthouse CI assertions", () => {
  it("fail the build when the layout shifts more than 0.05, the limit of a good score", () => {
    const [level, options] = assertions["cumulative-layout-shift"];
    expect(level).toBe("error");
    expect(options.maxNumericValue).toBe(0.05);
  });

  it("fail the build when the performance score drops below 90", () => {
    const [level, options] = assertions["categories:performance"];
    expect(level).toBe("error");
    expect(options.minScore).toBe(0.9);
  });

  it("warn when the largest contentful paint takes longer than 2.5 seconds", () => {
    const [level, options] = assertions["largest-contentful-paint"];
    expect(level).toBe("warn");
    expect(options.maxNumericValue).toBe(2500);
  });

  it("keep the size budgets of the scripts (128 KiB) and of the whole page (150 KiB, which includes the manifest and its 192 pixel icon that the browser fetches), a few percent above what the page weighs", () => {
    expect(
      assertions["resource-summary:script:size"][1].maxNumericValue,
    ).toBeLessThanOrEqual(131072);
    expect(
      assertions["resource-summary:total:size"][1].maxNumericValue,
    ).toBeLessThanOrEqual(153600);
  });

  it("measure the exported site three times", () => {
    expect(config.ci.collect.staticDistDir).toBe("out");
    expect(config.ci.collect.numberOfRuns).toBe(3);
  });
});
