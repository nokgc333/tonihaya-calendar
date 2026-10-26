import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test("opens a month card from the keyboard", async ({ page }) => {
  await openApp(page);
  await page.locator("section[role='button']").first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?y=2026&m=1$/);
  await page.keyboard.press("Escape");
  await page.locator("section[role='button']").nth(1).focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\?y=2026&m=2$/);
});

test("opens a day of the month from the keyboard", async ({ page }) => {
  await openApp(page, "?y=2026&m=7");
  await page.locator("[role='button']", { hasText: /^20/ }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?y=2026&m=7&d=20&v=week$/);
});

test("opens and closes the settings menu and puts the focus back on its button", async ({
  page,
}) => {
  await openApp(page);
  const gear = page.getByRole("button", { name: "設定" });
  await gear.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "設定" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "設定" })).toBeHidden();
  await expect(gear).toBeFocused();
});

test("keeps the settings menu from closing the view behind it with Escape", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "設定" }).click();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\?y=2026&m=7$/);
});

test("remembers the week start and the overview layout after a reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page);
  await page.getByRole("button", { name: "設定" }).click();
  await page
    .getByRole("dialog", { name: "設定" })
    .getByRole("button", { name: "月" })
    .click();
  await page.getByRole("button", { name: "4×3" }).click();
  await page.reload();
  await page.getByRole("button", { name: "設定" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "設定" })
      .getByRole("button", { name: "月" }),
  ).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("button", { name: "4×3" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("moves the focus into the event form and closes it with Escape", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await expect(page.getByLabel("タイトル")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
