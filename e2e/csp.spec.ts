import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

const config = JSON.parse(readFileSync("vercel.json", "utf-8"));
const policy = config.headers[0].headers.find(
  (h: { key: string }) => h.key === "Content-Security-Policy",
).value as string;

async function watchViolations(page: Page): Promise<() => Promise<string[]>> {
  await page.route("**/_vercel/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(
        `${e.violatedDirective} ${e.blockedURI}`,
      );
    });
  });
  return async () => [
    ...errors,
    ...(await page.evaluate(
      () => (window as unknown as { __csp: string[] }).__csp,
    )),
  ];
}

test("serves the pages with the policy of vercel.json, without inline scripts in it", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.headers()["content-security-policy"]).toBe(policy);
  expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  const inline = await page.locator("script:not([src])").count();
  expect(inline).toBe(0);
});

test("serves the same policy with the 404 page", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  expect(response?.headers()["content-security-policy"]).toBe(policy);
});

test("runs the whole app under the policy without a violation or an error", async ({
  page,
}) => {
  const problems = await watchViolations(page);
  await openApp(page);
  await page.locator("section[role='button']").nth(6).click();
  await page
    .locator("[class*='cursor-pointer']", { hasText: /^15$/ })
    .first()
    .click();
  await page.getByLabel("7月16日を開く").click();
  await page.getByRole("button", { name: "予定を作成" }).click();
  await page.getByLabel("タイトル").fill("Under the policy");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(
    page
      .getByLabel("Under the policy を編集")
      .or(page.getByTitle("Under the policy")),
  ).toBeVisible();
  await page.getByRole("button", { name: "設定" }).click();
  await page.keyboard.press("Escape");
  expect(await problems()).toEqual([]);
});

test("hydrates the page, so that scripts moved out of the page still run", async ({
  page,
}) => {
  await openApp(page);
  await page.locator("section[role='button']").first().click();
  await expect(page).toHaveURL(/\?y=2026&m=1$/);
});
