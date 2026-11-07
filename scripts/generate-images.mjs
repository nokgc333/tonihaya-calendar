#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createStaticServer } from "./serve-out.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_SVG = readFileSync(join(ROOT, "src/app/icon.svg"), "utf-8");
const TODAY = new Date(2026, 6, 15, 12, 0, 0);

const ICONS = [
  {
    file: "public/icon-192.png",
    size: 192,
    scale: 0.9,
    background: "transparent",
  },
  {
    file: "public/icon-512.png",
    size: 512,
    scale: 0.9,
    background: "transparent",
  },
  {
    file: "public/icon-maskable-512.png",
    size: 512,
    scale: 0.6,
    background: "#ffffff",
  },
  {
    file: "src/app/apple-icon.png",
    size: 180,
    scale: 0.78,
    background: "#ffffff",
  },
];

async function renderIcons(browser) {
  const page = await browser.newPage();
  for (const { file, size, scale, background } of ICONS) {
    await page.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * scale);
    await page.setContent(
      `<body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${background}">` +
        `<div style="width:${inner}px;height:${inner}px">${ICON_SVG.replace(/ width="32" height="32"/, ' width="100%" height="100%"')}</div></body>`,
    );
    const png = await page.screenshot({
      omitBackground: background === "transparent",
    });
    mkdirSync(dirname(join(ROOT, file)), { recursive: true });
    writeFileSync(join(ROOT, file), png);
    console.log(`wrote ${file}`);
  }
  await page.close();
}

async function renderShareImage(browser) {
  const server = createStaticServer(join(ROOT, "out"));
  await new Promise((done) => server.listen(0, done));
  const { port } = server.address();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 840 },
    deviceScaleFactor: 0.75,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(TODAY);
  await page.goto(`http://localhost:${port}/`);
  await page
    .getByRole("heading", { level: 1 })
    .filter({ hasText: "2026年" })
    .waitFor();
  await page.screenshot({ path: join(ROOT, "public/og.png") });
  console.log("wrote public/og.png");
  await context.close();
  await new Promise((done) => server.close(done));
}

const browser = await chromium.launch();
await renderIcons(browser);
await renderShareImage(browser);
await browser.close();
