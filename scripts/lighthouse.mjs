#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, ".lighthouse");
const OUT_BASE = join(OUT_DIR, "report");

const DEFAULT_URL = "https://tonihaya-calendar.vercel.app";
const args = process.argv.slice(2);
const desktop = args.includes("--desktop");
const url = args.find((a) => !a.startsWith("--")) ?? DEFAULT_URL;

mkdirSync(OUT_DIR, { recursive: true });

const lhArgs = [
  url,
  "--quiet",
  "--only-categories=performance",
  "--output=json",
  "--output=html",
  `--output-path=${OUT_BASE}`,
  '--chrome-flags=--headless=new',
];
if (desktop) lhArgs.push("--preset=desktop");

console.log(`\n▶ Lighthouse (${desktop ? "desktop" : "mobile"}) → ${url}\n`);

const bin = join(ROOT, "node_modules", ".bin", "lighthouse");
const run = spawnSync(bin, lhArgs, { stdio: ["ignore", "ignore", "inherit"] });
if (run.status !== 0) {
  console.error("\n✗ Lighthouse failed. If Chrome cannot be found, set the CHROME_PATH environment variable.");
  process.exit(run.status ?? 1);
}

const report = JSON.parse(readFileSync(`${OUT_BASE}.report.json`, "utf8"));
const score = Math.round((report.categories.performance.score ?? 0) * 100);
const a = report.audits;
const row = (label, audit) => `  ${label.padEnd(22)} ${a[audit]?.displayValue ?? "-"}`;

console.log(`\n■ Performance score: ${score} / 100  ${score >= 95 ? "✓ (SLO 95+)" : "✗ (below SLO 95+)"}\n`);
console.log(row("LCP", "largest-contentful-paint"));
console.log(row("FCP", "first-contentful-paint"));
console.log(row("CLS", "cumulative-layout-shift"));
console.log(row("Total Blocking Time", "total-blocking-time"));
console.log(row("Speed Index", "speed-index"));
console.log(row("Time to Interactive", "interactive"));
console.log(`\n📄 Detailed report: ${OUT_BASE}.report.html\n`);
