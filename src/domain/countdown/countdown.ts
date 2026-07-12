/** 遊びセクションの残日数 */
export interface Countdown {
  /** 次の土曜まで（本日が土曜なら0） */
  readonly toSaturday: number;
  /** 月末まで */
  readonly toMonthEnd: number;
  /** 今月末までの残り営業日（本日を含めず・土日＋祝日を除外） */
  readonly remainingBusinessDays: number;
  /** 年末まで */
  readonly toYearEnd: number;
}

import { daysInMonth } from "../calendar";
import { isHoliday } from "../holiday";
import { toEpochDay, weekdayOf } from "../shared/date";

const SATURDAY = 6;
const SUNDAY = 0;

/** 本日を含めず、翌日以降〜今月末までの営業日数（土日＋祝日を除外） */
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

/** 指定日の各残日数を返す */
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
