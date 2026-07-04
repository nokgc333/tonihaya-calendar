import { daysInMonth } from "../calendar";
import { getHolidaysInMonth, isHoliday, type Holiday } from "../holiday";
import { toEpochDay, weekdayOf } from "../shared/date";
import { buildMonthView, type MonthView, type YearViewSettings } from "./yearView";

const SUNDAY = 0;
const SATURDAY = 6;

/** 平日（土日でない）かつ祝日でないか */
function isBusinessDay(year: number, month: number, day: number): boolean {
  const weekday = weekdayOf(year, month, day);
  const isWeekend = weekday === SUNDAY || weekday === SATURDAY;
  return !isWeekend && !isHoliday(year, month, day);
}

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface MonthDetail {
  readonly month: MonthView;
  readonly holidays: readonly Holiday[];
  readonly dayCount: number;
  readonly holidayCount: number;
  /** 営業日数（平日 − 平日に当たる祝日） */
  readonly businessDayCount: number;
  /** 営業日残（本日以降の残り営業日。本日含む。本日不明時は全営業日） */
  readonly businessDaysRemaining: number;
}

/** その月の営業日数（土日・祝日を除く平日）を数える */
function countBusinessDays(year: number, month: number, dayCount: number): number {
  let count = 0;
  for (let day = 1; day <= dayCount; day++) {
    if (isBusinessDay(year, month, day)) {
      count += 1;
    }
  }
  return count;
}

/** 本日（含む）以降の残り営業日を数える。本日不明時は全営業日。 */
function countBusinessDaysRemaining(
  year: number,
  month: number,
  dayCount: number,
  today: CivilDate | null,
): number {
  if (today === null) {
    return countBusinessDays(year, month, dayCount);
  }
  const todayEpoch = toEpochDay(today.year, today.month, today.day);
  let count = 0;
  for (let day = 1; day <= dayCount; day++) {
    if (toEpochDay(year, month, day) < todayEpoch) continue;
    if (isBusinessDay(year, month, day)) {
      count += 1;
    }
  }
  return count;
}

export function buildMonthDetail(
  year: number,
  month: number,
  today: CivilDate | null,
  settings: YearViewSettings,
): MonthDetail {
  const monthView = buildMonthView(year, month, today, settings.weekStart);
  const holidays = getHolidaysInMonth(year, month);
  const dayCount = daysInMonth(year, month);
  return {
    month: monthView,
    holidays,
    dayCount,
    holidayCount: holidays.length,
    businessDayCount: countBusinessDays(year, month, dayCount),
    businessDaysRemaining: countBusinessDaysRemaining(year, month, dayCount, today),
  };
}
