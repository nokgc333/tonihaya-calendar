import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

async function countTransitions(page: Page): Promise<() => Promise<number>> {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: number };
    w.__vt = 0;
    const original = document.startViewTransition?.bind(document);
    if (original) {
      document.startViewTransition = ((callback: () => void) => {
        w.__vt += 1;
        return original(callback);
      }) as typeof document.startViewTransition;
    }
  });
  return () =>
    page.evaluate(() => (window as unknown as { __vt: number }).__vt);
}

test.describe("with the reduced motion setting", () => {
  test.use({ reducedMotion: "reduce" });

  test("changes the view without a view transition", async ({ page }) => {
    const count = await countTransitions(page);
    await openApp(page);
    await page.getByRole("group", { name: "7月" }).click();
    await expect(page).toHaveURL(/\?y=2026&m=7$/);
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\?y=2026$/);
    expect(await count()).toBe(0);
  });

  test("makes the CSS transitions and animations instant", async ({ page }) => {
    await openApp(page, "?y=2026&m=7");
    const durations = await page.evaluate(() => {
      const button = document.querySelector("button") as HTMLElement;
      const style = getComputedStyle(button);
      return [style.transitionDuration, style.animationDuration];
    });
    for (const value of durations) {
      expect(parseFloat(value)).toBeLessThan(0.001);
    }
  });
});

test.describe("without the reduced motion setting", () => {
  test.use({ reducedMotion: "no-preference" });

  test("changes the view with a view transition", async ({ page }) => {
    const count = await countTransitions(page);
    await openApp(page);
    await page.getByRole("group", { name: "7月" }).click();
    await expect(page).toHaveURL(/\?y=2026&m=7$/);
    expect(await count()).toBeGreaterThan(0);
  });
});
