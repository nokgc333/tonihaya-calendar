#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

export function resolveRequestPath(root, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(requestUrl, "http://localhost").pathname,
    );
  } catch {
    return null;
  }
  if (pathname.includes("\0") || pathname.split("/").includes("..")) {
    return null;
  }
  return resolve(root, `.${normalize(pathname)}`);
}

async function fileFor(root, requestUrl) {
  const target = resolveRequestPath(root, requestUrl);
  if (target === null) return null;
  for (const candidate of [target, join(target, "index.html")]) {
    const info = await stat(candidate).catch(() => null);
    if (info?.isFile()) return candidate;
  }
  return null;
}

export function createStaticServer(root) {
  return createServer(async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const file = await fileFor(root, req.url ?? "/");
    if (file === null) {
      const notFound = await fileFor(root, "/404.html");
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      res.end(notFound ? await readFile(notFound) : "Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    });
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 3100);
  const root = resolve(process.argv[3] ?? "out");
  createStaticServer(root).listen(port, () => {
    console.log(`Serving ${root} on http://localhost:${port}`);
  });
}
