/** 遊びセクションの残日数 */
export interface Countdown {
  /** 次の土曜まで（本日が土曜なら0） */
  readonly toSaturday: number;
  /** 月末まで */
  readonly toMonthEnd: number;
  /** 四半期末まで */
  readonly toQuarterEnd: number;
  /** 年末まで */
  readonly toYearEnd: number;
}

import { daysInMonth } from "../calendar";
import { toEpochDay, weekdayOf } from "../shared/date";

const SATURDAY = 6;
const MONTHS_PER_QUARTER = 3;

/** 指定日の各残日数を返す */
export function getCountdowns(
  year: number,
  month: number,
  day: number,
): Countdown {
  const today = toEpochDay(year, month, day);
  const weekday = weekdayOf(year, month, day);
  const quarterEndMonth = Math.ceil(month / MONTHS_PER_QUARTER) * MONTHS_PER_QUARTER;

  return {
    toSaturday: (SATURDAY - weekday + 7) % 7,
    toMonthEnd: daysInMonth(year, month) - day,
    toQuarterEnd:
      toEpochDay(year, quarterEndMonth, daysInMonth(year, quarterEndMonth)) - today,
    toYearEnd: toEpochDay(year, 12, 31) - today,
  };
}
