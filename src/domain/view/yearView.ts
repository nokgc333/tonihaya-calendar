import { getMonthGrid, type WeekStart } from "../calendar";
import { getCountdowns, type Countdown } from "../countdown";
import { getHoliday } from "../holiday";
import type { CivilDate } from "../shared/date";

const SATURDAY = 6;
const SUNDAY = 0;

const MONTH_LABELS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_LABELS_WAFU = [
  "睦月",
  "如月",
  "弥生",
  "卯月",
  "皐月",
  "水無月",
  "文月",
  "葉月",
  "長月",
  "神無月",
  "霜月",
  "師走",
] as const;

const MONTHS_PER_YEAR = 12;

export interface DayCell {
  readonly day: number;
  readonly weekday: number;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly isHoliday: boolean;
  readonly holidayName?: string;
  readonly isSaturday: boolean;
  readonly isSunday: boolean;
}

export interface MonthView {
  readonly month: number;
  readonly labelJa: string;
  readonly labelEn: string;
  readonly labelWafu: string;
  readonly weeks: readonly (readonly DayCell[])[];
}

export interface YearView {
  readonly year: number;
  readonly months: readonly MonthView[];
  readonly countdowns: Countdown | null;
}

export interface YearViewSettings {
  readonly weekStart: WeekStart;
}

export function buildMonthView(
  year: number,
  month: number,
  today: CivilDate | null,
  weekStart: WeekStart,
): MonthView {
  const weeks = getMonthGrid(year, month, weekStart).map((week) =>
    week.map((d): DayCell => {
      const holiday = d.inMonth ? getHoliday(d.year, d.month, d.day) : null;
      return {
        day: d.day,
        weekday: d.weekday,
        inMonth: d.inMonth,
        isToday:
          d.inMonth &&
          today !== null &&
          today.year === d.year &&
          today.month === d.month &&
          today.day === d.day,
        isHoliday: holiday !== null,
        holidayName: holiday?.name,
        isSaturday: d.weekday === SATURDAY,
        isSunday: d.weekday === SUNDAY,
      };
    }),
  );
  return {
    month,
    labelJa: `${month}月`,
    labelEn: MONTH_LABELS_EN[month - 1],
    labelWafu: MONTH_LABELS_WAFU[month - 1],
    weeks,
  };
}

export function buildYearView(
  year: number,
  today: CivilDate | null,
  settings: YearViewSettings,
): YearView {
  const months = Array.from({ length: MONTHS_PER_YEAR }, (_, i) =>
    buildMonthView(year, i + 1, today, settings.weekStart),
  );
  const countdowns =
    today !== null ? getCountdowns(today.year, today.month, today.day) : null;
  return { year, months, countdowns };
}
