import { getHoliday } from "../holiday";
import {
  fromEpochDay,
  toEpochDay,
  weekdayOf,
  type CivilDate,
} from "../shared/date";
import type { WeekStart } from "../calendar";

const DAYS_PER_WEEK = 7;
const SUNDAY = 0;
const SATURDAY = 6;
const MINUTES_PER_HOUR = 60;

export interface WeekDay {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: number;
  readonly isToday: boolean;
  readonly isHoliday: boolean;
  readonly holidayName?: string;
  readonly isSaturday: boolean;
  readonly isSunday: boolean;
}

export interface WeekViewModel {
  readonly days: readonly WeekDay[];
}

export function buildWeekView(
  reference: CivilDate,
  today: CivilDate | null,
  settings: { weekStart: WeekStart },
): WeekViewModel {
  const startOffset = settings.weekStart === "sun" ? 0 : 1;
  const refWeekday = weekdayOf(reference.year, reference.month, reference.day);
  const back = (refWeekday - startOffset + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const startEpoch =
    toEpochDay(reference.year, reference.month, reference.day) - back;

  const days: WeekDay[] = [];
  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    const d = fromEpochDay(startEpoch + i);
    const weekday = weekdayOf(d.year, d.month, d.day);
    const holiday = getHoliday(d.year, d.month, d.day);
    days.push({
      year: d.year,
      month: d.month,
      day: d.day,
      weekday,
      isToday:
        today !== null &&
        today.year === d.year &&
        today.month === d.month &&
        today.day === d.day,
      isHoliday: holiday !== null,
      holidayName: holiday?.name,
      isSaturday: weekday === SATURDAY,
      isSunday: weekday === SUNDAY,
    });
  }
  return { days };
}

export function minutesToOffset(minutes: number, hourHeightPx: number): number {
  return (minutes / MINUTES_PER_HOUR) * hourHeightPx;
}
