import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf-8");

type Rgb = readonly [number, number, number];
type Tokens = Record<string, string>;

const MIN_TEXT_RATIO = 4.5;

function blockAfter(marker: string): string {
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`${marker} is not in globals.css`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`${marker} has no end`);
}

function tokensOf(body: string): Tokens {
  const tokens: Tokens = {};
  for (const [, name, value] of body.matchAll(
    /(--[a-z0-9-]+)\s*:\s*([^;]+);/g,
  )) {
    tokens[name] = value.trim().replace(/\s+/g, " ");
  }
  return tokens;
}

const base = tokensOf(blockAfter(":root {"));
const darkMedia = tokensOf(
  blockAfter("@media (prefers-color-scheme: dark)").replace(
    /^\s*:root\s*\{/,
    "",
  ),
);
const forcedLight = tokensOf(blockAfter(':root[data-theme="light"]'));
const forcedDark = tokensOf(blockAfter(':root[data-theme="dark"]'));

const themes: Record<string, Tokens> = {
  "light by default": base,
  "light by choice": { ...base, ...forcedLight },
  "dark by the system setting": { ...base, ...darkMedia },
  "dark by choice": { ...base, ...forcedDark },
};

function parseHex(hex: string): Rgb {
  return [1, 3, 5].map((i) =>
    parseInt(hex.slice(i, i + 2), 16),
  ) as unknown as Rgb;
}

function resolve(value: string, tokens: Tokens): Rgb {
  const v = value.trim();
  if (v.startsWith("#")) return parseHex(v);
  const ref = /^var\((--[a-z0-9-]+)\)$/.exec(v);
  if (ref) return resolve(tokens[ref[1]], tokens);
  const mix = /^color-mix\(in srgb, (.+?) (\d+(?:\.\d+)?)%, (.+)\)$/.exec(v);
  if (mix) {
    const a = resolve(mix[1], tokens);
    const b = resolve(mix[3], tokens);
    const p = Number(mix[2]) / 100;
    return a.map((c, i) => c * p + b[i] * (1 - p)) as unknown as Rgb;
  }
  throw new Error(`cannot resolve ${v}`);
}

function luminance([r, g, b]: Rgb): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(fg: Rgb, bg: Rgb): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

const contrast = (tokens: Tokens, fg: string, bg: string): number =>
  ratio(resolve(`var(${fg})`, tokens), resolve(`var(${bg})`, tokens));

const SURFACES = ["--bg", "--surface", "--surface-2"];
const TINTS = ["--sat-bg", "--sun-bg"];
const COLORS = [
  "blue",
  "green",
  "teal",
  "purple",
  "pink",
  "amber",
  "slate",
  "rose",
];

describe.each(Object.entries(themes))("the %s theme", (_name, tokens) => {
  it.each([
    "--text",
    "--text-muted",
    "--text-faint",
    "--accent-red",
    "--accent-sat",
  ])("keeps %s readable on every surface", (fg) => {
    for (const bg of SURFACES) {
      expect(contrast(tokens, fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(
        MIN_TEXT_RATIO,
      );
    }
  });

  it.each(["--text", "--text-muted", "--text-faint"])(
    "keeps %s readable on the tinted weekend backgrounds",
    (fg) => {
      for (const bg of TINTS) {
        expect(
          contrast(tokens, fg, bg),
          `${fg} on ${bg}`,
        ).toBeGreaterThanOrEqual(MIN_TEXT_RATIO);
      }
    },
  );

  it("keeps the Sunday red on its tint and the Saturday blue on its tint readable", () => {
    expect(contrast(tokens, "--accent-red", "--sun-bg")).toBeGreaterThanOrEqual(
      MIN_TEXT_RATIO,
    );
    expect(contrast(tokens, "--accent-sat", "--sat-bg")).toBeGreaterThanOrEqual(
      MIN_TEXT_RATIO,
    );
  });

  it("keeps the holiday number readable on its disc", () => {
    expect(
      contrast(tokens, "--holiday-text", "--holiday-disc"),
    ).toBeGreaterThanOrEqual(MIN_TEXT_RATIO);
  });

  it("keeps the text of the today mark readable", () => {
    expect(contrast(tokens, "--today-fg", "--today-bg")).toBeGreaterThanOrEqual(
      MIN_TEXT_RATIO,
    );
  });

  it.each(COLORS)(
    "keeps the text of a %s event readable on its chip",
    (color) => {
      expect(
        contrast(tokens, `--ev-${color}-fg`, `--ev-${color}-bg`),
        color,
      ).toBeGreaterThanOrEqual(MIN_TEXT_RATIO);
    },
  );

  it("keeps the faint text lighter than the muted text, and the muted lighter than the main text", () => {
    const against = (fg: string) => contrast(tokens, fg, "--surface");
    expect(against("--text")).toBeGreaterThan(against("--text-muted"));
    expect(against("--text-muted")).toBeGreaterThan(against("--text-faint"));
  });
});

describe("the two ways to choose the dark theme", () => {
  it("give the dark colors the same values, so that the system setting and the manual setting agree", () => {
    for (const [name, value] of Object.entries(darkMedia)) {
      expect(forcedDark[name], name).toBe(value);
    }
  });
});
