import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  externalizeInlineScripts,
  externalizeSite,
} from "../../scripts/externalize-inline-scripts.mjs";

const PUBLIC_DIR = "/_next/static/inline";

const page = (...scripts: string[]) =>
  `<!DOCTYPE html><html><head><title>t</title></head><body><main>x</main>${scripts.join("")}</body></html>`;

const inline = (body: string, attrs = "") => `<script${attrs}>${body}</script>`;

describe("externalizeInlineScripts", () => {
  it("moves the inline scripts into one file, keeping their order", () => {
    const html = page(inline("a();"), inline("b();"), inline("c();"));
    const { html: out, script } = externalizeInlineScripts(html, PUBLIC_DIR);
    expect(script).toBe("a();\n;b();\n;c();");
    expect(out.match(/<script/g)).toHaveLength(1);
  });

  it("names the file after the hash of its content", () => {
    const { html, script, fileName } = externalizeInlineScripts(
      page(inline("a();")),
      PUBLIC_DIR,
    );
    const hash = createHash("sha256")
      .update(script!)
      .digest("hex")
      .slice(0, 16);
    expect(fileName).toBe(`${hash}.js`);
    expect(html).toContain(`<script src="${PUBLIC_DIR}/${hash}.js"></script>`);
  });

  it("puts the tag where the first inline script was", () => {
    const { html } = externalizeInlineScripts(
      page(
        '<script src="/x.js" async></script>',
        inline("a();"),
        inline("b();"),
      ),
      PUBLIC_DIR,
    );
    const own = html.indexOf(`<script src="${PUBLIC_DIR}`);
    expect(html.indexOf("/x.js")).toBeLessThan(own);
    expect(own).toBeLessThan(html.indexOf("</body>"));
  });

  it("preloads the file from the head so that it is fetched early", () => {
    const { html, fileName } = externalizeInlineScripts(
      page(inline("a();")),
      PUBLIC_DIR,
    );
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain(
      `<link rel="preload" href="${PUBLIC_DIR}/${fileName}" as="script"/>`,
    );
  });

  it("leaves scripts with a src alone", () => {
    const html = page('<script src="/a.js" async=""></script>');
    const result = externalizeInlineScripts(html, PUBLIC_DIR);
    expect(result.html).toBe(html);
    expect(result.script).toBeNull();
  });

  it("leaves data blocks that are not JavaScript alone", () => {
    const data = inline('{"a":1}', ' type="application/json"');
    const { html, script } = externalizeInlineScripts(
      page(data, inline("a();")),
      PUBLIC_DIR,
    );
    expect(html).toContain(data);
    expect(script).toBe("a();");
  });

  it("keeps a closing script tag inside a string from ending the script early", () => {
    const body = 'self.x.push([1,"<\\/script>"]);';
    const { script } = externalizeInlineScripts(page(inline(body)), PUBLIC_DIR);
    expect(script).toBe(body);
  });

  it("gives the same result for the same input", () => {
    const html = page(inline("a();"), inline("b();"));
    expect(externalizeInlineScripts(html, PUBLIC_DIR)).toEqual(
      externalizeInlineScripts(html, PUBLIC_DIR),
    );
  });

  it("leaves a page without inline scripts unchanged", () => {
    const html = page();
    expect(externalizeInlineScripts(html, PUBLIC_DIR).html).toBe(html);
  });

  it("does not leave any inline script that a policy without unsafe-inline would block", () => {
    const { html } = externalizeInlineScripts(
      page(inline("a();"), inline("b();"), '<script src="/c.js"></script>'),
      PUBLIC_DIR,
    );
    expect(html.match(/<script(?![^>]*\bsrc=)[^>]*>/g)).toBeNull();
  });
});

describe("externalizeSite", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  const site = () => {
    dir = mkdtempSync(join(tmpdir(), "externalize-"));
    mkdirSync(join(dir, "docs"));
    writeFileSync(
      join(dir, "index.html"),
      page(inline("a();"), inline("b();")),
    );
    writeFileSync(join(dir, "404.html"), page(inline("a();"), inline("c();")));
    writeFileSync(join(dir, "docs", "x.html"), page(inline("a();")));
    writeFileSync(join(dir, "index.txt"), "<script>self.a();</script>");
    return dir;
  };

  it("rewrites every page, including those in folders, and writes one file for each content", () => {
    const root = site();
    const result = externalizeSite(root);
    expect(result.pages).toBe(3);
    const files = readdirSync(join(root, "_next/static/inline"));
    expect(files).toHaveLength(3);
    for (const page of ["index.html", "404.html", "docs/x.html"]) {
      expect(readFileSync(join(root, page), "utf-8")).not.toMatch(
        /<script(?![^>]*\bsrc=)[^>]*>/,
      );
    }
  });

  it("shares the file between pages with the same scripts", () => {
    const root = site();
    writeFileSync(join(root, "docs", "y.html"), page(inline("a();")));
    externalizeSite(root);
    expect(readdirSync(join(root, "_next/static/inline"))).toHaveLength(3);
  });

  it("leaves files that are not pages alone", () => {
    const root = site();
    externalizeSite(root);
    expect(readFileSync(join(root, "index.txt"), "utf-8")).toBe(
      "<script>self.a();</script>",
    );
  });

  it("is safe to run twice", () => {
    const root = site();
    externalizeSite(root);
    const after = readFileSync(join(root, "index.html"), "utf-8");
    externalizeSite(root);
    expect(readFileSync(join(root, "index.html"), "utf-8")).toBe(after);
  });

  it("serves the script that the tag points to with the content of the inline scripts", () => {
    const root = site();
    externalizeSite(root);
    const html = readFileSync(join(root, "index.html"), "utf-8");
    const src = /<script src="([^"]+)">/.exec(html)![1];
    expect(readFileSync(join(root, src), "utf-8")).toBe("a();\n;b();");
  });
});
