import { describe, expect, test } from "vitest";
import { MAX_YEAR, MIN_YEAR, clampYear, resolveYearInput } from "./yearRange";

describe("clampYear", () => {
  test("a value in range is kept as is", () => {
    expect(clampYear(2026)).toBe(2026);
  });
  test("clamps to the lower and upper bounds", () => {
    expect(clampYear(1000)).toBe(MIN_YEAR);
    expect(clampYear(3000)).toBe(MAX_YEAR);
  });
});

describe("resolveYearInput (resolution on commit)", () => {
  test("a valid year gives that value", () => {
    expect(resolveYearInput("2050", 2000)).toBe(2050);
  });
  test("an empty string falls back (keeps the current value)", () => {
    expect(resolveYearInput("", 2000)).toBe(2000);
  });
  test("non-numeric input falls back", () => {
    expect(resolveYearInput("abc", 2000)).toBe(2000);
  });
  test("out of range is clamped", () => {
    expect(resolveYearInput("1000", 2000)).toBe(MIN_YEAR);
    expect(resolveYearInput("3000", 2000)).toBe(MAX_YEAR);
  });
  test("decimals are truncated", () => {
    expect(resolveYearInput("2026.9", 2000)).toBe(2026);
  });
});
