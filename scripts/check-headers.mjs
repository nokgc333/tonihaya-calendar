#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INLINE_SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
const JAVASCRIPT_TYPES = new Set(["", "text/javascript", "module"]);

export function compareHeaders(expected, actual) {
  return Object.entries(expected).flatMap(([name, value]) => {
    const found = actual.get(name);
    if (found === null) return [`${name} is missing`];
    return found === value
      ? []
      : [`${name} is '${found}' but should be '${value}'`];
  });
}

export function findInlineScripts(html) {
  return [...html.matchAll(INLINE_SCRIPT)].filter(([, attributes = ""]) => {
    if (/\bsrc\s*=/.test(attributes)) return false;
    const type = /\btype\s*=\s*["']?([^"'\s>]*)/.exec(attributes)?.[1] ?? "";
    return JAVASCRIPT_TYPES.has(type);
  });
}

function expectedHeaders() {
  const config = JSON.parse(readFileSync("vercel.json", "utf-8"));
  return Object.fromEntries(
    config.headers.flatMap((rule) => rule.headers.map((h) => [h.key, h.value])),
  );
}

async function check(url) {
  const response = await fetch(url);
  const problems = compareHeaders(expectedHeaders(), response.headers);
  if (response.status !== 200)
    problems.push(`status is ${response.status}, not 200`);
  const inline = findInlineScripts(await response.text());
  if (inline.length > 0)
    problems.push(`the page has ${inline.length} inline scripts`);
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node scripts/check-headers.mjs <url>");
    process.exit(2);
  }
  const problems = await check(url);
  if (problems.length > 0) {
    console.error(`${url}\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(
    `${url}: every header of vercel.json is set, and the page has no inline script`,
  );
}
