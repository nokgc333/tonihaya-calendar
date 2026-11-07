import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { externalizeInlineScripts } from "../../scripts/externalize-inline-scripts.mjs";

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
