import { expect, test } from "@playwright/test";
import { level, openApp } from "./helpers";

test("creates an all-day event, finds it after a reload, edits it and deletes it", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "予定を作成" }).click();
  const dialog = page.getByRole("dialog", { name: "予定を作成" });
  await dialog.getByLabel("タイトル").fill("Kickoff");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTitle("Kickoff")).toBeVisible();

  await page.reload();
  await expect(page.getByTitle("Kickoff")).toBeVisible();

  await page.getByTitle("Kickoff").click();
  const editor = page.getByRole("dialog", { name: "予定を編集" });
  await editor.getByLabel("タイトル").fill("Kickoff v2");
  await editor.getByRole("button", { name: "保存" }).click();
  await expect(page.getByTitle("Kickoff v2")).toBeVisible();
  await expect(page.getByTitle("Kickoff", { exact: true })).toHaveCount(0);

  page.once("dialog", (d) => d.accept());
  await page.getByTitle("Kickoff v2").click();
  await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();
  await expect(page.getByTitle("Kickoff v2")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTitle("Kickoff v2")).toHaveCount(0);
});

test("keeps the event when the deletion is declined", async ({ page }) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await page.getByLabel("タイトル").fill("Keep me");
  await page.getByRole("button", { name: "保存" }).click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByTitle("Keep me").click();
  await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByTitle("Keep me")).toBeVisible();
});

test("refuses to save without a title and says why", async ({ page }) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText(/タイトルを入力してください/)).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("shows a timed event in the week and in the day at its hour", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7&d=15&v=day");
  await page.getByRole("button", { name: "予定を作成" }).click();
  const dialog = page.getByRole("dialog", { name: "予定を作成" });
  await dialog.getByLabel("タイトル").fill("Standup");
  await dialog.getByLabel("終日").uncheck();
  await dialog.getByLabel("開始時刻").fill("09:30");
  await dialog.getByLabel("終了時刻").fill("10:30");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(page.getByLabel("Standup を編集")).toBeVisible();

  await level(page, "週").click();
  await expect(page.getByLabel("Standup を編集")).toBeVisible();
});

test("keeps an event that spans several days visible on each of them", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7&d=15&v=week");
  await page.getByRole("button", { name: "予定を作成" }).click();
  const dialog = page.getByRole("dialog", { name: "予定を作成" });
  await dialog.getByLabel("タイトル").fill("Offsite");
  await dialog.getByLabel("終了日").fill("2026-07-17");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(page.getByTitle("Offsite")).toHaveCount(3);
});

test("closes the form with Escape without saving", async ({ page }) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await page.getByLabel("タイトル").fill("Never saved");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByTitle("Never saved")).toHaveCount(0);
});
