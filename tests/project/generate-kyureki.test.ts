import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildKyurekiRows,
  renderKyurekiTable,
} from "../../scripts/generate-kyureki.mjs";

const rows = buildKyurekiRows({ offsetHours: 9 });
const newYearDay = (row: (typeof rows)[number]) =>
  Date.UTC(row.year, 0, 1) / 86_400_000 + row.newYearOffset;

describe("the old calendar table generator", () => {
  it("reproduces the committed table exactly", () => {
    expect(readFileSync("src/domain/kyureki/table.ts", "utf-8")).toBe(
      renderKyurekiTable(buildKyurekiRows()),
    );
  });

  it("renders month lengths with the first month in the least significant bit", () => {
    const source = renderKyurekiTable([
      {
        year: 2000,
        newYearOffset: 35,
        leapMonth: 0,
        longMonths: Array.from({ length: 12 }, (_, i) => i % 2 === 0),
      },
      {
        year: 2001,
        newYearOffset: 23,
        leapMonth: 4,
        longMonths: Array.from({ length: 13 }, (_, i) => i === 12),
      },
    ]);
    expect(source).toBe(
      "// Generated file. Do not edit. Regenerate: npm run generate:kyureki\n" +
        "// Bit i (LSB first) is 1 when month i in calendar order has 30 days.\n" +
        "export const KYUREKI_FIRST_YEAR = 2000;\n\n" +
        "export const KYUREKI_ROWS: readonly (readonly [number, number, number])[] = [\n" +
        "  [35, 0, 1365],\n  [23, 4, 4096],\n];\n",
    );
  });

  it("builds complete lunar years with valid lengths and leap months", () => {
    expect(rows).toHaveLength(202);
    const following = buildKyurekiRows({ firstYear: 2151, lastYear: 2151 });
    for (const [i, row] of rows.entries()) {
      expect(row.year).toBe(1949 + i);
      expect(row.newYearOffset).toBeGreaterThanOrEqual(0);
      expect(row.newYearOffset).toBeLessThanOrEqual(60);
      expect(row.leapMonth).toBeGreaterThanOrEqual(0);
      expect(row.leapMonth).toBeLessThanOrEqual(12);
      expect(row.longMonths).toHaveLength(row.leapMonth === 0 ? 12 : 13);
      const lengths = row.longMonths.map((long) => (long ? 30 : 29));
      expect(lengths.every((length) => length === 29 || length === 30)).toBe(
        true,
      );
      expect(lengths.reduce((sum, length) => sum + length, 0)).toBe(
        newYearDay(rows[i + 1] ?? following[0]) - newYearDay(row),
      );
    }
  });
});
