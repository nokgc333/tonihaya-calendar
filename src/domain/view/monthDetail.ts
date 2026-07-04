import { daysInMonth } from "../calendar";
import { getHolidaysInMonth, isHoliday, type Holiday } from "../holiday";
import { weekdayOf } from "../shared/date";
import { buildMonthView, type MonthView, type YearViewSettings } from "./yearView";

const SUNDAY = 0;
const SATURDAY = 6;

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
}

/** その月の営業日数（土日・祝日を除く平日）を数える */
function countBusinessDays(year: number, month: number, dayCount: number): number {
  let count = 0;
  for (let day = 1; day <= dayCount; day++) {
    const weekday = weekdayOf(year, month, day);
    const isWeekend = weekday === SUNDAY || weekday === SATURDAY;
    if (!isWeekend && !isHoliday(year, month, day)) {
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
  };
}
