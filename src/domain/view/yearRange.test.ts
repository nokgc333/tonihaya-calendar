import { describe, expect, test } from "vitest";
import { MAX_YEAR, MIN_YEAR, clampYear, resolveYearInput } from "./yearRange";

describe("clampYear", () => {
  test("範囲内はそのまま", () => {
    expect(clampYear(2026)).toBe(2026);
  });
  test("下限・上限でクランプ", () => {
    expect(clampYear(1000)).toBe(MIN_YEAR);
    expect(clampYear(3000)).toBe(MAX_YEAR);
  });
});

describe("resolveYearInput（確定時の解決）", () => {
  test("有効な年はその値", () => {
    expect(resolveYearInput("2050", 2000)).toBe(2050);
  });
  test("空文字はフォールバック（現在値を維持）", () => {
    expect(resolveYearInput("", 2000)).toBe(2000);
  });
  test("数値でない入力はフォールバック", () => {
    expect(resolveYearInput("abc", 2000)).toBe(2000);
  });
  test("範囲外はクランプ", () => {
    expect(resolveYearInput("1000", 2000)).toBe(MIN_YEAR);
    expect(resolveYearInput("3000", 2000)).toBe(MAX_YEAR);
  });
  test("小数は切り捨て", () => {
    expect(resolveYearInput("2026.9", 2000)).toBe(2026);
  });
});
