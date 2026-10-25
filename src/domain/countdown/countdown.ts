export interface Countdown {
  readonly toSaturday: number;
  readonly toMonthEnd: number;
  readonly remainingBusinessDays: number;
  readonly toYearEnd: number;
}

import { daysInMonth } from "../calendar";
import { isHoliday } from "../holiday";
import { toEpochDay, weekdayOf } from "../shared/date";

const SATURDAY = 6;
const SUNDAY = 0;

function countRemainingBusinessDays(year: number, month: number, day: number): number {
  const lastDay = daysInMonth(year, month);
  let count = 0;
  for (let d = day + 1; d <= lastDay; d += 1) {
    const weekday = weekdayOf(year, month, d);
    const isWeekend = weekday === SATURDAY || weekday === SUNDAY;
    if (!isWeekend && !isHoliday(year, month, d)) {
      count += 1;
    }
  }
  return count;
}

export function getCountdowns(
  year: number,
  month: number,
  day: number,
): Countdown {
  const today = toEpochDay(year, month, day);
  const weekday = weekdayOf(year, month, day);

  return {
    toSaturday: (SATURDAY - weekday + 7) % 7,
    toMonthEnd: daysInMonth(year, month) - day,
    remainingBusinessDays: countRemainingBusinessDays(year, month, day),
    toYearEnd: toEpochDay(year, 12, 31) - today,
  };
}
