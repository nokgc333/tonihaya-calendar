#!/usr/bin/env node
import { createServer } from "node:http";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
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

const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

function encodeBody(body, contentType, acceptEncoding = "") {
  if (!COMPRESSIBLE.test(contentType)) return { body, encoding: null };
  const accepted = acceptEncoding.split(",").map((e) => e.trim().split(";")[0]);
  if (accepted.includes("br"))
    return { body: brotliCompressSync(body), encoding: "br" };
  if (accepted.includes("gzip"))
    return { body: gzipSync(body), encoding: "gzip" };
  return { body, encoding: null };
}

export function headersFromConfig(config) {
  const rules = config.headers ?? [];
  for (const rule of rules) {
    if (rule.source !== "/(.*)") {
      throw new Error(
        `Unsupported source ${rule.source}: this server only applies the rule for every path`,
      );
    }
  }
  return Object.fromEntries(
    rules.flatMap((rule) => rule.headers.map((h) => [h.key, h.value])),
  );
}

export function createStaticServer(root, headers = {}) {
  return createServer(async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { ...headers, Allow: "GET, HEAD" }).end();
      return;
    }
    const file = await fileFor(root, req.url ?? "/");
    if (file === null) {
      const notFound = await fileFor(root, "/404.html");
      res.writeHead(404, { ...headers, "Content-Type": TYPES[".html"] });
      res.end(notFound ? await readFile(notFound) : "Not found");
      return;
    }
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    const { body, encoding } = encodeBody(
      await readFile(file),
      type,
      req.headers["accept-encoding"],
    );
    res.writeHead(200, {
      ...headers,
      "Content-Type": type,
      Vary: "Accept-Encoding",
      ...(encoding ? { "Content-Encoding": encoding } : {}),
      "Content-Length": body.length,
    });
    res.end(req.method === "HEAD" ? undefined : body);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 3100);
  const root = resolve(process.argv[3] ?? "out");
  const config = JSON.parse(readFileSync("vercel.json", "utf-8"));
  createStaticServer(root, headersFromConfig(config)).listen(port, () => {
    console.log(`Serving ${root} on http://localhost:${port}`);
  });
}
