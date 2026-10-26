import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test("lists the holidays of the month with the date and the weekday", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await expect(page.getByText("海の日")).toBeVisible();
  await expect(page.locator("li", { hasText: "海の日" })).toHaveText(
    "7/20(月)海の日",
  );
});

test("says there is no holiday in a month without one", async ({ page }) => {
  await openApp(page, "?y=2026&m=6");
  await expect(page.getByText("祝日なし")).toBeVisible();
});

test("shows the substitute holiday in the month it falls in", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=5");
  await expect(page.getByText("振替休日")).toBeVisible();
});

test("names the holiday on the day cell and in the all-day row of the week", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7&d=20&v=week");
  await expect(page.getByText("海の日")).toBeVisible();
});

test("lists the holidays of the year beside the months on a wide screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1700, height: 1000 });
  await openApp(page);
  const aside = page.locator("aside");
  await expect(aside.getByText("祝日一覧")).toBeVisible();
  await aside.getByText("海の日").click();
  await expect(page).toHaveURL(/\?y=2026&m=7$/);
});

test("shows the era year of the shown day in the header", async ({ page }) => {
  await openApp(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "令和8年",
  );
});
