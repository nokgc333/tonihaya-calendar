import { expect, test } from "@playwright/test";
import { level, openApp } from "./helpers";

test("the page opens on the year with twelve months and today in the header", async ({
  page,
}) => {
  await openApp(page);
  await expect(page.locator("section[role='button']")).toHaveCount(12);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "2026年(令和8年) 7月15日 水曜日",
  );
});

test("zooms from the year to the month, the week and the day, and back with Escape", async ({
  page,
}) => {
  await openApp(page);
  await page.locator("section[role='button']").nth(6).click();
  await expect(page).toHaveURL(/\?y=2026&m=7$/);
  await expect(page.getByText("2026年 7月", { exact: true })).toBeVisible();

  await page
    .locator("[class*='cursor-pointer']", { hasText: /^15$/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\?y=2026&m=7&d=15&v=week$/);
  await expect(page.getByText("2026年 7月12日 〜 7月18日")).toBeVisible();

  await page.getByLabel("7月16日を開く").click();
  await expect(page).toHaveURL(/\?y=2026&m=7&d=16&v=day$/);
  await expect(page.getByText("2026年7月16日（木）")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/v=week$/);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\?y=2026&m=7$/);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\?y=2026$/);
});

test("jumps between levels with the level switcher", async ({ page }) => {
  await openApp(page);
  await level(page, "日").click();
  await expect(page).toHaveURL(/\?y=2026&m=7&d=15&v=day$/);
  await level(page, "週").click();
  await expect(page).toHaveURL(/v=week$/);
  await level(page, "月").click();
  await expect(page).toHaveURL(/\?y=2026&m=7$/);
  await level(page, "年").click();
  await expect(page).toHaveURL(/\?y=2026$/);
});

test("steps through the months, the weeks and the days with the arrow buttons", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=12");
  await page.getByLabel("次の月").click();
  await expect(page.getByText("2027年 1月", { exact: true })).toBeVisible();
  await level(page, "週").click();
  await page.getByLabel("次の週").click();
  await expect(page.getByText(/〜/)).toBeVisible();
  await level(page, "日").click();
  await page.getByLabel("前の日").click();
  await expect(page).toHaveURL(/v=day$/);
});

test("follows the browser history back and forward", async ({ page }) => {
  await openApp(page);
  await page.locator("section[role='button']").nth(2).click();
  await expect(page).toHaveURL(/\?y=2026&m=3$/);
  await page.goBack();
  await expect(page.locator("section[role='button']")).toHaveCount(12);
  await page.goForward();
  await expect(page.getByText("2026年 3月", { exact: true })).toBeVisible();
});

test("opens a deep link on the day and keeps the view after a reload", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=3&d=10&v=day");
  await expect(page.getByText("2026年3月10日（火）")).toBeVisible();
  await page.reload();
  await expect(page.getByText("2026年3月10日（火）")).toBeVisible();
});

test("changes the year with the buttons and the input", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "1 ›" }).click();
  await expect(page).toHaveURL(/\?y=2027$/);
  await page.getByLabel("表示する年（Enterで確定）").fill("2031");
  await page.getByLabel("表示する年（Enterで確定）").press("Enter");
  await expect(page).toHaveURL(/\?y=2031$/);
  await page.getByRole("button", { name: "今年" }).click();
  await expect(page).toHaveURL(/\?y=2026$/);
});
