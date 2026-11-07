import type { Page } from "@playwright/test";

const TODAY = new Date(2026, 6, 15, 12, 0, 0);

export async function openApp(page: Page, search = ""): Promise<void> {
  await page.clock.setFixedTime(TODAY);
  await page.goto(`/${search}`);
  await page
    .getByRole("heading", { level: 1 })
    .filter({ hasText: "2026年" })
    .waitFor();
}

export const level = (page: Page, label: "年" | "月" | "週" | "日") =>
  page
    .getByRole("group", { name: "表示レベルの切替" })
    .getByRole("button", { name: label, exact: true });
