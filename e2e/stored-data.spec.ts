import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

const legacyText = readFileSync(
  "tests/fixtures/legacy-v0-events.json",
  "utf-8",
);
const KEY = "tonihaya.events";

const seed = (page: Page, value: string) =>
  page.addInitScript(
    ([key, text]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, text);
    },
    [KEY, value] as const,
  );

const stored = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), key);

test("opens the data that the first version wrote, shows every event and moves it to the current format", async ({
  page,
}) => {
  await seed(page, legacyText);
  await openApp(page, "?y=2026&m=7");
  await expect(page.getByTitle("打合せ")).toBeVisible();
  await expect(page.getByTitle("終日 blue")).toBeVisible();
  await openApp(page, "?y=2026&m=12");
  await expect(page.getByTitle("年またぎ").first()).toBeVisible();
  const migrated = JSON.parse((await stored(page, KEY))!);
  expect(migrated.version).toBe(1);
  expect(migrated.events).toHaveLength(12);
  expect(await stored(page, `${KEY}.legacy-v0`)).toBe(legacyText);
});

test("shows the timed events of the old data in the day view", async ({
  page,
}) => {
  await seed(page, legacyText);
  await openApp(page, "?y=2026&m=7&d=15&v=day");
  await expect(page.getByLabel("打合せ を編集")).toBeVisible();
});

test("keeps working when the saved data is broken, and keeps the broken text aside", async ({
  page,
}) => {
  await seed(page, "{this is not json");
  await openApp(page, "?y=2026&m=7");
  await expect(page.locator("main")).toBeVisible();
  expect(await stored(page, `${KEY}.backup`)).toBe("{this is not json");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await page.getByLabel("タイトル").fill("After the recovery");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByTitle("After the recovery")).toBeVisible();
  await page.reload();
  await expect(page.getByTitle("After the recovery")).toBeVisible();
});

test("does not offer a link from saved data that points to a script", async ({
  page,
}) => {
  const hostile = JSON.stringify([
    {
      id: "h",
      title: "Hostile",
      allDay: true,
      start: { date: { year: 2026, month: 7, day: 15 } },
      end: { date: { year: 2026, month: 7, day: 15 } },
      colorKey: "blue",
      priority: "normal",
      url: "javascript:alert(document.domain)",
      createdAt: 1,
      updatedAt: 1,
    },
  ]);
  await seed(page, hostile);
  await openApp(page, "?y=2026&m=7");
  await page.getByTitle("Hostile").click();
  await expect(page.getByRole("dialog", { name: "予定を編集" })).toBeVisible();
  await expect(page.getByLabel("URL")).toHaveValue("");
  await expect(page.getByRole("link", { name: /リンクを開く/ })).toHaveCount(0);
  expect(await stored(page, KEY)).not.toContain("javascript:");
});

test("sets aside an event that cannot be used and shows the others", async ({
  page,
}) => {
  const good = {
    id: "g",
    title: "Good",
    allDay: true,
    start: { date: { year: 2026, month: 7, day: 15 } },
    end: { date: { year: 2026, month: 7, day: 15 } },
    colorKey: "blue",
    priority: "normal",
    createdAt: 1,
    updatedAt: 1,
  };
  const broken = {
    ...good,
    id: "b",
    title: "Broken",
    start: { date: { year: 2026, month: 2, day: 30 } },
  };
  await seed(page, JSON.stringify([good, broken]));
  await openApp(page, "?y=2026&m=7");
  await expect(page.getByTitle("Good")).toBeVisible();
  await expect(page.getByTitle("Broken")).toHaveCount(0);
  const aside = JSON.parse((await stored(page, `${KEY}.rejected`))!);
  expect(aside[0].value.title).toBe("Broken");
});
