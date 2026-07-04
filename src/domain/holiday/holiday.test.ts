import { describe, expect, test } from "vitest";
import { getHoliday, getHolidaysInYear, isHoliday } from "./holiday";

describe("固定祝日（2024年）", () => {
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
  ])("%d/%d は %s", (m, d, name) => {
    expect(getHoliday(2024, m, d)?.name).toBe(name);
  });
});

describe("ハッピーマンデー（2024年）", () => {
  test.each([
    [1, 8, "成人の日"],
    [7, 15, "海の日"],
    [9, 16, "敬老の日"],
    [10, 14, "スポーツの日"],
  ])("%d/%d は %s", (m, d, name) => {
    expect(getHoliday(2024, m, d)?.name).toBe(name);
  });
});

describe("春分・秋分（2024年）", () => {
  test("3/20 は春分の日", () => {
    expect(getHoliday(2024, 3, 20)?.name).toBe("春分の日");
  });
  test("9/22 は秋分の日", () => {
    expect(getHoliday(2024, 9, 22)?.name).toBe("秋分の日");
  });
});

describe("振替休日（2024年）", () => {
  test.each([
    [2, 12], // 建国記念の日(2/11 日) の振替
    [5, 6], // こどもの日(5/5 日) の振替
    [8, 12], // 山の日(8/11 日) の振替
    [9, 23], // 秋分の日(9/22 日) の振替
    [11, 4], // 文化の日(11/3 日) の振替
  ])("%d/%d は振替休日", (m, d) => {
    expect(getHoliday(2024, m, d)?.name).toBe("振替休日");
  });
});

describe("国民の休日（2026年）", () => {
  test("9/22 は国民の休日（敬老9/21と秋分9/23に挟まれる）", () => {
    expect(getHoliday(2026, 9, 22)?.name).toBe("国民の休日");
  });
});

describe("非祝日", () => {
  test("2024-01-02 は祝日でない", () => {
    expect(isHoliday(2024, 1, 2)).toBe(false);
  });
});

describe("getHolidaysInYear", () => {
  test("2024年は21日の祝日（振替含む）", () => {
    expect(getHolidaysInYear(2024)).toHaveLength(21);
  });
  test("日付昇順で返る", () => {
    const list = getHolidaysInYear(2024);
    const keys = list.map((h) => h.date.month * 100 + h.date.day);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });
});

import { getHolidaysInMonth } from "./holiday";

describe("getHolidaysInMonth", () => {
  test("5月(2026)は全て month===5", () => {
    const list = getHolidaysInMonth(2026, 5);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((h) => h.date.month === 5)).toBe(true);
  });
  test("6月(2026)は祝日なし", () => {
    expect(getHolidaysInMonth(2026, 6)).toHaveLength(0);
  });
});
