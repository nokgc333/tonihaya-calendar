import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

const views = [
  ["the year", ""],
  ["the month", "?y=2026&m=7"],
  ["the week", "?y=2026&m=7&d=15&v=week"],
  ["the day", "?y=2026&m=7&d=15&v=day"],
] as const;

for (const [width, height] of [
  [375, 812],
  [768, 1024],
] as const) {
  for (const [name, search] of views) {
    test(`does not scroll sideways on ${name} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openApp(page, search);
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }
}
