import { describe, expect, test } from "vitest";
import { daysInMonth } from "./date";

describe("daysInMonth", () => {
  test("各月の日数", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28); // 平年
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
  test("うるう年の2月", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29); // 400で割れる
    expect(daysInMonth(1900, 2)).toBe(28); // 100で割れて400で割れない
  });
});
