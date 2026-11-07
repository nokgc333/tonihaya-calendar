import { getHoliday } from "../holiday";
import { weekdayOf, type CivilDate } from "../shared/date";
import type { WeekDay } from "./weekView";

const SUNDAY = 0;
const SATURDAY = 6;

export interface DayViewModel {
  readonly day: WeekDay;
}

export function buildDayView(
  year: number,
  month: number,
  day: number,
  today: CivilDate | null,
): DayViewModel {
  const weekday = weekdayOf(year, month, day);
  const holiday = getHoliday(year, month, day);
  return {
    day: {
      year,
      month,
      day,
      weekday,
      isToday:
        today !== null &&
        today.year === year &&
        today.month === month &&
        today.day === day,
      isHoliday: holiday !== null,
      holidayName: holiday?.name,
      isSaturday: weekday === SATURDAY,
      isSunday: weekday === SUNDAY,
    },
  };
}
