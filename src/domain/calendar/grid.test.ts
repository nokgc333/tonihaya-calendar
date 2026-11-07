import { describe, expect, test } from "vitest";
import { daysInMonth, isLeapYear } from "./grid";

describe("isLeapYear", () => {
  test("a year divisible by 4 is a leap year", () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  test("a year not divisible by 4 is a common year", () => {
    expect(isLeapYear(2023)).toBe(false);
  });

  test("a year divisible by 100 but not by 400 is a common year", () => {
    expect(isLeapYear(2100)).toBe(false);
  });

  test("a year divisible by 400 is a leap year", () => {
    expect(isLeapYear(2000)).toBe(true);
  });
});

describe("daysInMonth", () => {
  test("February has 29 days in a leap year", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  test("February has 28 days in a common year", () => {
    expect(daysInMonth(2023, 2)).toBe(28);
  });

  test("January has 31 days", () => {
    expect(daysInMonth(2024, 1)).toBe(31);
  });

  test("April has 30 days", () => {
    expect(daysInMonth(2024, 4)).toBe(30);
  });
});
