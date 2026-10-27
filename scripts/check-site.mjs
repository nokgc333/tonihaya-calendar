#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const DEFAULT_URL = "https://tonihaya-calendar.vercel.app";
const EXPECTED_MONTHS = 12;
const FILES = [
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/og.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
];

export function findProblems(facts) {
  const problems = [];
  if (facts.months !== EXPECTED_MONTHS) {
    problems.push(
      `the year view shows ${facts.months} months, not ${EXPECTED_MONTHS}`,
    );
  }
  if (!facts.dialogOpened) problems.push("the event form did not open");
  for (const v of facts.cspViolations) problems.push(`policy violation: ${v}`);
  for (const e of facts.pageErrors) problems.push(`page error: ${e}`);
  if (facts.inlineScripts > 0) {
    problems.push(`the page has ${facts.inlineScripts} inline scripts`);
  }
  for (const field of ["canonical", "ogImage", "manifest"]) {
    if (!facts[field]) problems.push(`${field} is missing`);
  }
  if (facts.jsonLd === 0) problems.push("structured data is missing");
  for (const f of facts.files) {
    if (f.status !== 200) {
      problems.push(`${f.path} answered ${f.status} (${f.type})`);
    }
  }
  return problems;
}

async function collectFacts(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
  });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push(`console: ${m.text()}`);
  });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  await page.goto(`${url}/`);
  await page
    .getByRole("heading", { level: 1 })
    .filter({ hasText: "年" })
    .waitFor({ timeout: 15000 });
  const months = await page.getByRole("group", { name: /^\d+月$/ }).count();
  await page.getByRole("group", { name: "7月" }).click();
  await page.waitForURL(/m=7/);
  await page.getByRole("button", { name: "予定を作成" }).click();
  const dialogOpened = await page.getByRole("dialog").isVisible();
  await page.keyboard.press("Escape");
  const head = (selector, attribute) =>
    page.locator(selector).first().getAttribute(attribute);
  const facts = {
    months,
    dialogOpened,
    cspViolations: await page.evaluate(() => window.__csp),
    pageErrors,
    inlineScripts: await page
      .locator("script:not([src]):not([type='application/ld+json'])")
      .count(),
    canonical: await head("link[rel=canonical]", "href"),
    ogImage: await head("meta[property='og:image']", "content"),
    manifest: await head("link[rel=manifest]", "href"),
    jsonLd: await page.locator("script[type='application/ld+json']").count(),
    files: [],
  };
  for (const path of FILES) {
    const r = await page.request.get(`${url}${path}`);
    facts.files.push({
      path,
      status: r.status(),
      type: r.headers()["content-type"] ?? "",
    });
  }
  await browser.close();
  return facts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = (process.argv[2] ?? DEFAULT_URL).replace(/\/$/, "");
  const problems = findProblems(await collectFacts(url));
  if (problems.length > 0) {
    console.error(`${url}\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(
    `${url}: the year view, the event form, the policy, the metadata and the files are all fine`,
  );
}
