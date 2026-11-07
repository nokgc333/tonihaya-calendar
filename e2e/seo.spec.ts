import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const SITE = "https://tonihaya-calendar.vercel.app";
const head = (
  page: import("@playwright/test").Page,
  selector: string,
  attribute: string,
) => page.locator(selector).first().getAttribute(attribute);

test("names the page and its canonical address, the same for every view", async ({
  page,
}) => {
  for (const search of ["", "?y=2027&m=3", "?y=2026&m=7&d=15&v=day"]) {
    await page.goto(`/${search}`);
    await expect(page).toHaveTitle(/tonihaya-calendar/);
    expect(await head(page, "link[rel=canonical]", "href")).toBe(SITE);
    expect(await head(page, "meta[property='og:url']", "content")).toBe(SITE);
  }
});

test("describes the page when it is shared", async ({ page }) => {
  await page.goto("/");
  const meta = (property: string) =>
    head(page, `meta[property='${property}']`, "content");
  expect(await meta("og:title")).toContain("tonihaya-calendar");
  expect((await meta("og:description"))!.length).toBeGreaterThan(30);
  expect(await meta("og:type")).toBe("website");
  expect(await meta("og:locale")).toBe("ja_JP");
  expect(await meta("og:image")).toBe(`${SITE}/og.png`);
  expect(await meta("og:image:width")).toBe("1200");
  expect(await meta("og:image:height")).toBe("630");
  expect(await meta("og:image:alt")).toBeTruthy();
  expect(await head(page, "meta[name='twitter:card']", "content")).toBe(
    "summary_large_image",
  );
  expect(await head(page, "meta[name='twitter:image']", "content")).toBe(
    `${SITE}/og.png`,
  );
});

test("serves the share image at the address it names", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const url = new URL(
    (await head(page, "meta[property='og:image']", "content"))!,
  );
  const response = await request.get(url.pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  expect((await response.body()).length).toBeGreaterThan(10_000);
});

test("links the icons and the manifest, and serves them", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const manifestHref = (await head(page, "link[rel=manifest]", "href"))!;
  const manifest = await (await request.get(manifestHref)).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"], icon.src).toBe("image/png");
  }
  const touch = (await head(page, "link[rel=apple-touch-icon]", "href"))!;
  expect((await request.get(touch)).status()).toBe(200);
  expect(await head(page, "link[rel=icon]", "type")).toBe("image/svg+xml");
});

test("serves robots.txt that points to a sitemap that lists the page", async ({
  request,
}) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("User-Agent: *");
  expect(robots).toContain("Allow: /");
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.headers()["content-type"]).toContain("xml");
  expect(await sitemap.text()).toContain(`<loc>${SITE}</loc>`);
});

test("describes the page as a web application in structured data that is valid JSON", async ({
  page,
}) => {
  await page.goto("/");
  const text = await page
    .locator("script[type='application/ld+json']")
    .textContent();
  const data = JSON.parse(text!);
  expect(data["@type"]).toBe("WebApplication");
  expect(data.url).toBe(SITE);
  expect(data.name).toBe("tonihaya-calendar");
});

test("keeps the structured data in step with the title and the description of the page", async ({
  page,
}) => {
  await page.goto("/");
  const data = JSON.parse(
    (await page.locator("script[type='application/ld+json']").textContent())!,
  );
  expect(data.description).toBe(
    await head(page, "meta[name=description]", "content"),
  );
});

test("has exactly one main heading, and the language of the page is set", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.locator("html").getAttribute("lang")).toBe("ja");
});

test("sets the colors of the browser bar for both themes", async ({ page }) => {
  await page.goto("/");
  const light = await head(
    page,
    "meta[name=theme-color][media*=light]",
    "content",
  );
  const dark = await head(
    page,
    "meta[name=theme-color][media*=dark]",
    "content",
  );
  const css = readFileSync("src/app/globals.css", "utf-8");
  expect(css).toContain(`--bg: ${light};`);
  expect(css).toContain(`--bg: ${dark};`);
});
