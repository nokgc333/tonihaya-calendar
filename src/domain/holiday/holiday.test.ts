import { describe, expect, test } from "vitest";
import { getHoliday, getHolidaysInYear, isHoliday } from "./holiday";

describe("fixed holidays (2024)", () => {
  test.each([
    [1, 1, "元日"],
    [2, 11, "建国記念の日"],
    [2, 23, "天皇誕生日"],
    [4, 29, "昭和の日"],
    [5, 3, "憲法記念日"],
    [5, 4, "みどりの日"],
    [5, 5, "こどもの日"],
    [8, 11, "山の日"],
    [11, 3, "文化の日"],
    [11, 23, "勤労感謝の日"],
  ])("%d/%d is %s", (m, d, name) => {
    expect(getHoliday(2024, m, d)?.name).toBe(name);
  });
});

describe("Happy Monday holidays (2024)", () => {
  test.each([
    [1, 8, "成人の日"],
    [7, 15, "海の日"],
    [9, 16, "敬老の日"],
    [10, 14, "スポーツの日"],
  ])("%d/%d is %s", (m, d, name) => {
    expect(getHoliday(2024, m, d)?.name).toBe(name);
  });
});

describe("spring and autumn equinoxes (2024)", () => {
  test("3/20 is the Vernal Equinox Day", () => {
    expect(getHoliday(2024, 3, 20)?.name).toBe("春分の日");
  });
  test("9/22 is the Autumnal Equinox Day", () => {
    expect(getHoliday(2024, 9, 22)?.name).toBe("秋分の日");
  });
});

describe("substitute holidays (2024)", () => {
  test.each([
    [2, 12],
    [5, 6],
    [8, 12],
    [9, 23],
    [11, 4],
  ])("%d/%d is a substitute holiday", (m, d) => {
    expect(getHoliday(2024, m, d)?.name).toBe("振替休日");
  });
});

describe("citizens' holidays (2026)", () => {
  test("9/22 is a citizens' holiday (between Respect for the Aged Day 9/21 and the autumnal equinox 9/23)", () => {
    expect(getHoliday(2026, 9, 22)?.name).toBe("国民の休日");
  });
});

describe("non-holidays", () => {
  test("2024-01-02 is not a holiday", () => {
    expect(isHoliday(2024, 1, 2)).toBe(false);
  });
});

describe("getHolidaysInYear", () => {
  test("2024 has 21 holidays (including substitutes)", () => {
    expect(getHolidaysInYear(2024)).toHaveLength(21);
  });
  test("returns holidays in ascending date order", () => {
    const list = getHolidaysInYear(2024);
    const keys = list.map((h) => h.date.month * 100 + h.date.day);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });
});

import { getHolidaysInMonth } from "./holiday";

describe("getHolidaysInMonth", () => {
  test("every holiday in May (2026) has month===5", () => {
    const list = getHolidaysInMonth(2026, 5);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((h) => h.date.month === 5)).toBe(true);
  });
  test("June (2026) has no holidays", () => {
    expect(getHolidaysInMonth(2026, 6)).toHaveLength(0);
  });
});
