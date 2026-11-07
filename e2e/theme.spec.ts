import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test("chooses a theme in the settings and keeps it after a reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openApp(page);
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", /.+/);

  await page.getByRole("button", { name: "設定" }).click();
  const group = page.getByRole("group", { name: "テーマ" });
  await group.getByRole("button", { name: "ダーク" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("--bg").trim(),
    ),
  ).toBe("#0e0f11");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "設定" }).click();
  await page
    .getByRole("group", { name: "テーマ" })
    .getByRole("button", { name: "システム" })
    .click();
  await expect(html).not.toHaveAttribute("data-theme", /.+/);
});

test("applies the saved theme before the page is interactive", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("tonihaya.theme", "dark");
  });
  await page.emulateMedia({ colorScheme: "light" });
  const seen: (string | null)[] = [];
  await page.exposeFunction("recordTheme", (value: string | null) => {
    seen.push(value);
  });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      (
        window as unknown as { recordTheme: (v: string | null) => void }
      ).recordTheme(document.documentElement.getAttribute("data-theme"));
    });
  });
  await openApp(page);
  expect(seen[0]).toBe("dark");
});
