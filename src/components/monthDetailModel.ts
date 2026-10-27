import { weekdayOf, type CivilDate } from "@/domain/shared/date";
import { WEEKDAY_JA } from "@/components/weekdays";

const MONTHS_PER_YEAR = 12;

export interface YearMonth {
  readonly year: number;
  readonly month: number;
}

export function neighborMonth(
  { year, month }: YearMonth,
  delta: -1 | 1,
): YearMonth {
  if (delta === -1) {
    return month === 1
      ? { year: year - 1, month: MONTHS_PER_YEAR }
      : { year, month: month - 1 };
  }
  return month === MONTHS_PER_YEAR
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}

export function defaultEventDate(
  today: CivilDate | null,
  { year, month }: YearMonth,
): CivilDate {
  return today && today.year === year && today.month === month
    ? today
    : { year, month, day: 1 };
}

export function weekdayLabel(date: CivilDate): string {
  return WEEKDAY_JA[weekdayOf(date.year, date.month, date.day)];
}
