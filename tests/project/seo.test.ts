import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "../../src/app/manifest";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";
import {
  OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from "../../src/app/site";
import {
  serializeJsonLd,
  webApplicationJsonLd,
} from "../../src/app/structuredData";

const root = process.cwd();
const PNG_SIGNATURE = "89504e470d0a1a0a";

function pngSize(file: string): {
  width: number;
  height: number;
  isPng: boolean;
} {
  const bytes = readFileSync(join(root, file));
  return {
    isPng: bytes.subarray(0, 8).toString("hex") === PNG_SIGNATURE,
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

describe("the site constants", () => {
  it("give the address without a trailing slash, over https", () => {
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });

  it("give a title and a description that fit a search result", () => {
    expect(SITE_TITLE.length).toBeGreaterThan(10);
    expect(SITE_TITLE.length).toBeLessThanOrEqual(60);
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(50);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });

  it("start the title with the name of the site", () => {
    expect(SITE_TITLE.startsWith(SITE_NAME)).toBe(true);
  });
});

describe("robots", () => {
  const rules = robots();

  it("lets every crawler read everything", () => {
    expect(rules.rules).toEqual({ userAgent: "*", allow: "/" });
  });

  it("points to the sitemap on the address of the site", () => {
    expect(rules.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe("sitemap", () => {
  it("lists the one page, in the same form as the canonical address, because the views are only the query of that page", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([SITE_URL]);
  });

  it("carries no date that would change on every build", () => {
    expect(sitemap()[0].lastModified).toBeUndefined();
  });
});

describe("manifest", () => {
  const m = manifest();

  it("names the app and opens it at the root, as an installed app", () => {
    expect(m.name).toBe(SITE_NAME);
    expect(m.short_name).toBeTruthy();
    expect(m.short_name!.length).toBeLessThanOrEqual(12);
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("ja");
  });

  it("uses the colors of the light theme for the splash and the title bar", () => {
    expect(m.theme_color).toBe(THEME_COLOR_LIGHT);
    expect(m.background_color).toBe(THEME_COLOR_LIGHT);
  });

  it("offers the sizes that installation needs, plus a maskable one", () => {
    const sizes = (m.icons ?? []).map(
      (i) => `${i.sizes}:${i.purpose ?? "any"}`,
    );
    expect(sizes).toContain("192x192:any");
    expect(sizes).toContain("512x512:any");
    expect(sizes).toContain("512x512:maskable");
  });

  it("points to icon files that exist, are PNG and have the size they claim", () => {
    for (const icon of m.icons ?? []) {
      const file = join("public", icon.src);
      expect(existsSync(join(root, file)), icon.src).toBe(true);
      const { isPng, width, height } = pngSize(file);
      expect(isPng, icon.src).toBe(true);
      expect(`${width}x${height}`, icon.src).toBe(icon.sizes);
      expect(icon.type, icon.src).toBe("image/png");
    }
  });
});

describe("the share image", () => {
  it("is a PNG of 1200 by 630, the size that most services show in full", () => {
    const { isPng, width, height } = pngSize(join("public", OG_IMAGE.url));
    expect(isPng).toBe(true);
    expect([width, height]).toEqual([1200, 630]);
    expect([OG_IMAGE.width, OG_IMAGE.height]).toEqual([1200, 630]);
  });

  it("has a description for people who cannot see it", () => {
    expect(OG_IMAGE.alt.length).toBeGreaterThan(10);
  });

  it("stays small enough to load quickly when shared", () => {
    const bytes = readFileSync(join(root, "public", OG_IMAGE.url)).length;
    expect(bytes).toBeLessThan(300_000);
  });
});

describe("the touch icon", () => {
  it("is an opaque-sized PNG of 180 by 180 that the app folder serves by its convention", () => {
    const { isPng, width, height } = pngSize("src/app/apple-icon.png");
    expect(isPng).toBe(true);
    expect([width, height]).toEqual([180, 180]);
  });

  it("keeps the browser tab icon as it was", () => {
    expect(existsSync(join(root, "src/app/icon.svg"))).toBe(true);
  });
});

describe("the structured data", () => {
  const data = webApplicationJsonLd();

  it("describes the page as a web application of the site", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("WebApplication");
    expect(data.name).toBe(SITE_NAME);
    expect(data.url).toBe(SITE_URL);
    expect(data.description).toBe(SITE_DESCRIPTION);
    expect(data.inLanguage).toBe("ja");
  });

  it("names a category and says that it runs in any browser, without claiming more", () => {
    expect(data.applicationCategory).toBe("UtilitiesApplication");
    expect(data.operatingSystem).toBe("Any");
    expect(Object.keys(data).sort()).toEqual(
      [
        "@context",
        "@type",
        "applicationCategory",
        "description",
        "inLanguage",
        "name",
        "operatingSystem",
        "url",
      ].sort(),
    );
  });

  it("is serialized so that it can never close the script tag it is placed in", () => {
    const text = serializeJsonLd({
      a: "</script><script>alert(1)</script>",
      b: "<!--",
    });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({
      a: "</script><script>alert(1)</script>",
      b: "<!--",
    });
  });

  it("is valid JSON when serialized", () => {
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});

describe("the theme colors", () => {
  it("match the background of each theme in the stylesheet", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf-8");
    expect(css).toContain(`--bg: ${THEME_COLOR_LIGHT};`);
    expect(css).toContain(`--bg: ${THEME_COLOR_DARK};`);
  });
});
