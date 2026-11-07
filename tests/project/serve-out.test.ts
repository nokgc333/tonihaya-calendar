import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import type { AddressInfo } from "node:net";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createStaticServer,
  resolveRequestPath,
} from "../../scripts/serve-out.mjs";

const root = resolve("/site");

describe("resolveRequestPath", () => {
  it("maps a path inside the root", () => {
    expect(resolveRequestPath(root, "/a/b.js?x=1")).toBe(
      resolve(root, "a/b.js"),
    );
  });

  it("maps the root itself", () => {
    expect(resolveRequestPath(root, "/")).toBe(root);
  });

  it.each([
    "/../secret",
    "/a/../../secret",
    "/%2e%2e/secret",
    "/../site-other/x",
    "/..%2f..%2fetc/passwd",
    "/%2e%2e%2fsecret",
    "//../secret",
    "/a/%2e%2e/%2e%2e/secret",
  ])("never leaves the root for %s", (url) => {
    const path = resolveRequestPath(root, url);
    expect(path === null || path === root || path.startsWith(root + sep)).toBe(
      true,
    );
  });

  it.each(["/%2e%2e%2fsecret", "/..%2f..%2fetc/passwd"])(
    "refuses an encoded slash that would walk up from %s",
    (url) => {
      expect(resolveRequestPath(root, url)).toBeNull();
    },
  );

  it.each(["/a%00.js", "/%E0%A4%A"])("refuses %s", (url) => {
    expect(resolveRequestPath(root, url)).toBeNull();
  });
});

describe("the static server", () => {
  let dir: string;
  let server: ReturnType<typeof createStaticServer>;
  let base: string;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "serve-out-"));
    writeFileSync(join(dir, "index.html"), "<h1>home</h1>");
    writeFileSync(join(dir, "404.html"), "<h1>missing</h1>");
    mkdirSync(join(dir, "_next"));
    writeFileSync(join(dir, "_next", "app.js"), "console.log(1)");
    writeFileSync(join(dir, "..secret"), "outside");
    server = createStaticServer(dir);
    await new Promise<void>((done) => server.listen(0, done));
    base = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((done) => server.close(done));
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves the index for the root and for a query string", async () => {
    expect(await (await fetch(`${base}/?y=2026`)).text()).toBe("<h1>home</h1>");
  });

  it("serves a file with its content type", async () => {
    const res = await fetch(`${base}/_next/app.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/javascript");
  });

  it("answers an unknown path with the 404 page and the 404 status", async () => {
    const res = await fetch(`${base}/nothing`);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("<h1>missing</h1>");
  });

  it("does not serve a file outside the root", async () => {
    const res = await fetch(`${base}/%2e%2e/${dir.split("/").pop()}`);
    expect([403, 404]).toContain(res.status);
  });

  it("refuses methods that change things", async () => {
    const res = await fetch(`${base}/`, { method: "POST" });
    expect(res.status).toBe(405);
  });

  it("answers HEAD without a body", async () => {
    const res = await fetch(`${base}/`, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });
});
