import { describe, expect, test } from "vitest";
import { daysInMonth, toEpochDay, fromEpochDay, weekdayOf } from "./date";

describe("daysInMonth", () => {
  test("number of days in each month", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
  test("February in a leap year", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
  });
});

describe("civil date arithmetic", () => {
  test.each([
    [1970, 1, 1, 0],
    [1969, 12, 31, -1],
    [2000, 2, 29, 11016],
    [1, 1, 1, -719162],
  ])(
    "converts %i-%i-%i to epoch day %i and back",
    (year, month, day, epoch) => {
      expect(toEpochDay(year, month, day)).toBe(epoch);
      expect(fromEpochDay(epoch)).toEqual({ year, month, day });
    },
  );

  test.each([
    [1970, 1, 1, 4],
    [2024, 2, 29, 4],
    [2026, 1, 4, 0],
  ])("finds the weekday of %i-%i-%i", (year, month, day, weekday) => {
    expect(weekdayOf(year, month, day)).toBe(weekday);
  });

  test("crosses month, leap day and year boundaries", () => {
    expect(fromEpochDay(toEpochDay(2024, 2, 28) + 1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
    expect(fromEpochDay(toEpochDay(2024, 2, 29) + 1)).toEqual({
      year: 2024,
      month: 3,
      day: 1,
    });
    expect(fromEpochDay(toEpochDay(2025, 12, 31) + 1)).toEqual({
      year: 2026,
      month: 1,
      day: 1,
    });
  });
});
