import { weekdayOf } from "../shared/date";
import type { CalendarDay, CalendarWeek, WeekStart } from "./types";

/** うるう年判定（グレゴリオ暦） */
export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/** 各月の日数（平年）。インデックス0=1月 */
const DAYS_IN_MONTH_COMMON = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 指定年月の日数（月は1–12） */
export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return DAYS_IN_MONTH_COMMON[month - 1];
}

const DAYS_PER_WEEK = 7;

/**
 * 指定年月のカレンダーグリッドを週配列で返す。
 * 前後月の埋め日は inMonth=false。週の開始曜日は weekStart で切替。
 */
export function getMonthGrid(
  year: number,
  month: number,
  weekStart: WeekStart = "sun",
): CalendarWeek[] {
  const startOffset = weekStart === "sun" ? 0 : 1;
  const firstWeekday = weekdayOf(year, month, 1);
  const leadingCount = (firstWeekday - startOffset + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const totalDays = daysInMonth(year, month);
  const cellCount =
    Math.ceil((leadingCount + totalDays) / DAYS_PER_WEEK) * DAYS_PER_WEEK;

  const days: CalendarDay[] = [];
  for (let i = 0; i < cellCount; i++) {
    const date = new Date(Date.UTC(year, month - 1, 1 - leadingCount + i));
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    days.push({
      year: y,
      month: m,
      day: date.getUTCDate(),
      weekday: date.getUTCDay(),
      inMonth: y === year && m === month,
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < days.length; i += DAYS_PER_WEEK) {
    weeks.push(days.slice(i, i + DAYS_PER_WEEK));
  }
  return weeks;
}
