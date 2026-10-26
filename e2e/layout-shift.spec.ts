import { expect, test, type Page } from "@playwright/test";

const MAX_SHIFT = 0.01;

async function measureShift(page: Page, path: string): Promise<number> {
  await page.addInitScript(() => {
    const w = window as unknown as { __shift: number };
    w.__shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) w.__shift += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(path);
  await page
    .getByRole("heading", { level: 1 })
    .filter({ hasText: "年" })
    .waitFor();
  await page.waitForTimeout(1000);
  return page.evaluate(
    () => (window as unknown as { __shift: number }).__shift,
  );
}

for (const [name, size] of [
  ["a phone", { width: 375, height: 812 }],
  ["a desktop", { width: 1280, height: 800 }],
] as const) {
  for (const [view, path] of [
    ["the year", "/"],
    ["the month", "/?y=2026&m=7"],
    ["the week", "/?y=2026&m=7&d=15&v=week"],
    ["the day", "/?y=2026&m=7&d=15&v=day"],
  ] as const) {
    test(`does not shift the layout while ${view} loads on ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      expect(await measureShift(page, path)).toBeLessThanOrEqual(MAX_SHIFT);
    });
  }
}
