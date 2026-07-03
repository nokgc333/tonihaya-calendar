import { describe, expect, test } from "vitest";
import { daysInMonth, isLeapYear } from "./grid";

describe("isLeapYear", () => {
  test("4で割り切れる年はうるう年", () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  test("4で割り切れない年は平年", () => {
    expect(isLeapYear(2023)).toBe(false);
  });

  test("100で割り切れるが400で割り切れない年は平年", () => {
    expect(isLeapYear(2100)).toBe(false);
  });

  test("400で割り切れる年はうるう年", () => {
    expect(isLeapYear(2000)).toBe(true);
  });
});

describe("daysInMonth", () => {
  test("うるう年の2月は29日", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  test("平年の2月は28日", () => {
    expect(daysInMonth(2023, 2)).toBe(28);
  });

  test("1月は31日", () => {
    expect(daysInMonth(2024, 1)).toBe(31);
  });

  test("4月は30日", () => {
    expect(daysInMonth(2024, 4)).toBe(30);
  });
});
