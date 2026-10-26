#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = "/_next/static/inline";
const SCRIPT_TAG = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
const JAVASCRIPT_TYPES = new Set(["", "text/javascript", "module"]);
const HASH_LENGTH = 16;
const SEPARATOR = "\n;";

function isInlineJavaScript(attributes) {
  if (/\bsrc\s*=/.test(attributes)) return false;
  const type = /\btype\s*=\s*["']?([^"'\s>]*)/.exec(attributes)?.[1] ?? "";
  return JAVASCRIPT_TYPES.has(type);
}

export function externalizeInlineScripts(html, publicDir = PUBLIC_DIR) {
  const bodies = [];
  let firstAt = -1;
  const withoutInline = html.replace(
    SCRIPT_TAG,
    (tag, attributes = "", body, offset) => {
      if (!isInlineJavaScript(attributes)) return tag;
      if (firstAt < 0) firstAt = offset;
      bodies.push(body);
      return firstAt === offset ? "\u0000" : "";
    },
  );
  if (bodies.length === 0) return { html, script: null, fileName: null };

  const script = bodies.join(SEPARATOR);
  const hash = createHash("sha256")
    .update(script)
    .digest("hex")
    .slice(0, HASH_LENGTH);
  const fileName = `${hash}.js`;
  const url = `${publicDir}/${fileName}`;
  const preload = `<link rel="preload" href="${url}" as="script"/>`;
  const rewritten = withoutInline
    .replace("\u0000", `<script src="${url}"></script>`)
    .replace("</head>", `${preload}</head>`);
  return { html: rewritten, script, fileName };
}

function pagesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pagesIn(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

export function externalizeSite(root) {
  const outDir = join(root, "_next/static/inline");
  mkdirSync(outDir, { recursive: true });
  let pages = 0;
  for (const page of pagesIn(root)) {
    const { html, script, fileName } = externalizeInlineScripts(
      readFileSync(page, "utf-8"),
    );
    if (script === null) continue;
    writeFileSync(join(outDir, fileName), script);
    writeFileSync(page, html);
    pages += 1;
  }
  return { pages };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? "out");
  const { pages } = externalizeSite(root);
  console.log(
    `Moved the inline scripts of ${pages} pages into ${join(root, "_next/static/inline")}`,
  );
}
