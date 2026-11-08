import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

const yearInput = (page: Page) => page.getByLabel("表示する年（Enterで確定）");

test("moves by one year and by ten years, forward and back", async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole("button", { name: "10 ››", exact: true }).click();
  await expect(page).toHaveURL(/\?y=2036$/);
  await page.getByRole("button", { name: "‹ 1", exact: true }).click();
  await expect(page).toHaveURL(/\?y=2035$/);
  await page.getByRole("button", { name: "‹‹ 10", exact: true }).click();
  await expect(page).toHaveURL(/\?y=2025$/);
  await expect(yearInput(page)).toHaveValue("2025");
  await expect(
    page.getByRole("heading", { level: 1 }).filter({ hasText: "2026年" }),
  ).toBeVisible();
});

test("jumps to any year that is typed, and confirms it with Enter or by leaving the field", async ({
  page,
}) => {
  await openApp(page);
  await yearInput(page).fill("1999");
  await yearInput(page).press("Enter");
  await expect(page).toHaveURL(/\?y=1999$/);

  await yearInput(page).fill("2100");
  await page.getByRole("button", { name: "今年" }).focus();
  await expect(page).toHaveURL(/\?y=2100$/);
});

test("stops at the first and the last supported year", async ({ page }) => {
  await openApp(page, "?y=1952");
  await expect(page.getByText("1950–2150")).toBeVisible();
  await page.getByRole("button", { name: "‹‹ 10", exact: true }).click();
  await expect(page).toHaveURL(/\?y=1950$/);
  await page.getByRole("button", { name: "‹ 1", exact: true }).click();
  await expect(page).toHaveURL(/\?y=1950$/);

  await yearInput(page).fill("2149");
  await yearInput(page).press("Enter");
  await page.getByRole("button", { name: "10 ››", exact: true }).click();
  await expect(page).toHaveURL(/\?y=2150$/);
  await page.getByRole("button", { name: "1 ›", exact: true }).click();
  await expect(page).toHaveURL(/\?y=2150$/);
});

test("rounds a year outside the range to its end, and ignores an empty or invalid entry", async ({
  page,
}) => {
  await openApp(page, "?y=2030");
  await yearInput(page).fill("645");
  await yearInput(page).press("Enter");
  await expect(page).toHaveURL(/\?y=1950$/);

  await yearInput(page).fill("3000");
  await yearInput(page).press("Enter");
  await expect(page).toHaveURL(/\?y=2150$/);

  await yearInput(page).fill("");
  await yearInput(page).press("Enter");
  await expect(page).toHaveURL(/\?y=2150$/);
  await expect(yearInput(page)).toHaveValue("2150");
});

test("keeps the month and the day levels when the year is changed in the month", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "次の月" }).click();
  await expect(page).toHaveURL(/\?y=2026&m=8$/);
  await page.getByRole("button", { name: "前の月" }).click();
  await page.getByRole("button", { name: "前の月" }).click();
  await expect(page).toHaveURL(/\?y=2026&m=6$/);
});
