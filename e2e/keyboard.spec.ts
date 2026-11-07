import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

test("opens a month card from the keyboard", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "1月を開く", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?y=2026&m=1$/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "2月を開く", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\?y=2026&m=2$/);
});

test("opens a day of the month from the keyboard", async ({ page }) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "7月20日を開く" }).focus();
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

test("offers a skip link as the first tab stop, and it moves the focus to the main content", async ({
  page,
}) => {
  await openApp(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "本文へ移動" });
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("main").locator(":focus")).toBeVisible();
});

test("keeps the skip link out of sight until it is focused", async ({
  page,
}) => {
  await openApp(page);
  const skip = page.getByRole("link", { name: "本文へ移動" });
  expect((await skip.boundingBox())!.y).toBeLessThan(0);
});

test("names the landmarks of every view", async ({ page }) => {
  for (const [search, nav] of [
    ["", "年の表示の操作"],
    ["?y=2026&m=7", "月の表示の操作"],
    ["?y=2026&m=7&d=15&v=week", "週の表示の操作"],
    ["?y=2026&m=7&d=15&v=day", "日の表示の操作"],
  ] as const) {
    await openApp(page, search);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: nav })).toBeVisible();
  }
});

test("draws a visible focus ring on every control that the keyboard reaches", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await openApp(page, "?y=2026&m=7");
  const seen = new Set<string>();
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        tag:
          el === document.body
            ? "BODY"
            : `${el.tagName}:${el.getAttribute("aria-label") ?? el.textContent?.slice(0, 12)}`,
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
      };
    });
    if (info.tag === "BODY") break;
    expect(info.style, info.tag).not.toBe("none");
    expect(info.width, info.tag).toBeGreaterThanOrEqual(2);
    seen.add(info.tag);
  }
  expect(seen.size).toBeGreaterThan(8);
});

test("moves between the days of the month with the arrow keys and opens one with Enter", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  const today = page.getByRole("button", { name: "7月15日を開く" });
  await expect(today).toHaveAttribute("tabindex", "0");
  await today.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "7月16日を開く" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("button", { name: "7月23日を開く" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("button", { name: "7月15日を開く" }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("button", { name: "7月18日を開く" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?y=2026&m=7&d=18&v=week$/);
});

test("lets the keyboard pass the whole month grid with one Tab", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "7月15日を開く" }).focus();
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() =>
    (document.activeElement as HTMLElement).getAttribute("aria-label"),
  );
  expect(focused ?? "").not.toMatch(/日を開く$/);
});

test("announces the view that it moves to, and what happened to an event", async ({
  page,
}) => {
  await openApp(page);
  const status = page.getByRole("status");
  await expect(status).toHaveText("");
  await page.getByRole("button", { name: "7月を開く", exact: true }).click();
  await expect(status).toHaveText("2026年7月を表示しています");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await page.getByLabel("タイトル").fill("Announced");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(status).toHaveText(/予定を保存しました/);
  page.once("dialog", (d) => d.accept());
  await page.getByTitle("Announced").click();
  await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();
  await expect(status).toHaveText(/予定を削除しました/);
});
