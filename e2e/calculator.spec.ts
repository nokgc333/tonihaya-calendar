import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test("calculates the examples of the requirements in the dialog", async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole("button", { name: "時間計算を開く" }).click();
  const dialog = page.getByRole("dialog", { name: "時間計算" });
  await expect(dialog).toBeVisible();

  const time = dialog.getByRole("region", { name: "時刻に時間を足す・引く" });
  await time.getByLabel("時刻").fill("14:30");
  await time.getByLabel("分").fill("45");
  await expect(time.locator("output")).toHaveText("結果: 15:15");

  const diff = dialog.getByRole("region", { name: /^時刻と時刻の差/ });
  await diff.getByLabel("はじめ").fill("09:00");
  await diff.getByLabel("おわり").fill("17:30");
  await expect(diff.locator("output")).toHaveText("結果: 8時間30分");

  const date = dialog.getByRole("region", { name: "日付に日数を足す・引く" });
  await date.getByLabel("日付").fill("2026-07-04");
  await date.getByLabel("日数").fill("30");
  await expect(date.locator("output")).toHaveText("結果: 2026年8月3日（月）");

  const days = dialog.getByRole("region", { name: "日付と日付の日数の差" });
  await days.getByLabel("はじめ").fill("2026-07-04");
  await days.getByLabel("おわり").fill("2026-12-31");
  await expect(days.locator("output")).toHaveText("結果: 180日");

  const length = dialog.getByRole("region", { name: "時間と時間を足す・引く" });
  await length.getByLabel("時間(1つ目)").fill("1");
  await length.getByLabel("分(1つ目)").fill("20");
  await length.getByLabel("時間(2つ目)").fill("2");
  await length.getByLabel("分(2つ目)").fill("50");
  await expect(length.locator("output")).toHaveText("結果: 4時間10分");
});

test("opens and closes with the keyboard, and Escape does not leave the month", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "時間計算を開く" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "時間計算" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("時刻", { exact: true })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\?y=2026&m=7$/);
  await expect(
    page.getByRole("button", { name: "時間計算を開く" }),
  ).toBeFocused();
});
