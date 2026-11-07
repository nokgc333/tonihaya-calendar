import { daysInMonth } from "../calendar";
import { getHolidaysInMonth, isHoliday, type Holiday } from "../holiday";
import { toEpochDay, weekdayOf, type CivilDate } from "../shared/date";
import {
  buildMonthView,
  type MonthView,
  type YearViewSettings,
} from "./yearView";

const SUNDAY = 0;
const SATURDAY = 6;

function isBusinessDay(year: number, month: number, day: number): boolean {
  const weekday = weekdayOf(year, month, day);
  const isWeekend = weekday === SUNDAY || weekday === SATURDAY;
  return !isWeekend && !isHoliday(year, month, day);
}

export interface MonthDetail {
  readonly month: MonthView;
  readonly holidays: readonly Holiday[];
  readonly dayCount: number;
  readonly holidayCount: number;
  readonly businessDayCount: number;
  readonly businessDaysRemaining: number;
}

function countBusinessDays(
  year: number,
  month: number,
  dayCount: number,
): number {
  let count = 0;
  for (let day = 1; day <= dayCount; day++) {
    if (isBusinessDay(year, month, day)) {
      count += 1;
    }
  }
  return count;
}

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
    businessDaysRemaining: countBusinessDaysRemaining(
      year,
      month,
      dayCount,
      today,
    ),
  };
}
