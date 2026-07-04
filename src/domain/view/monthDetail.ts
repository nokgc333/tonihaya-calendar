import { daysInMonth } from "../calendar";
import { getHolidaysInMonth, type Holiday } from "../holiday";
import { buildMonthView, type MonthView, type YearViewSettings } from "./yearView";

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
}

export function buildMonthDetail(
  year: number,
  month: number,
  today: CivilDate | null,
  settings: YearViewSettings,
): MonthDetail {
  const monthView = buildMonthView(year, month, today, settings.weekStart);
  const holidays = getHolidaysInMonth(year, month);
  return {
    month: monthView,
    holidays,
    dayCount: daysInMonth(year, month),
    holidayCount: holidays.length,
  };
}
