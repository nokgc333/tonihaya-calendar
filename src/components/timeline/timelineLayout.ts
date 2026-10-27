import { minutesToOffset, type WeekDay } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";

export const HOUR_HEIGHT = 48;
export const HOURS = Array.from({ length: 24 }, (_, h) => h);
export const DAY_GRID_COLS = "3.5rem 1fr";
export const GRID_COLS = "3.5rem repeat(7, minmax(4.5rem, 1fr))";
const SCROLL_LEAD_HOURS = 2;
const MINUTES_PER_HOUR = 60;

export function isSameDay(target: CivilDate | null, day: WeekDay): boolean {
  return (
    target !== null &&
    target.year === day.year &&
    target.month === day.month &&
    target.day === day.day
  );
}

export function weekRangeLabel(first: WeekDay, last: WeekDay): string {
  const end =
    first.year !== last.year
      ? `${last.year}年 ${last.month}月${last.day}日`
      : `${last.month}月${last.day}日`;
  return `${first.year}年 ${first.month}月${first.day}日 〜 ${end}`;
}

function minutesOfDay(now: Date): number {
  return now.getHours() * MINUTES_PER_HOUR + now.getMinutes();
}

export function nowLineOffset(now: Date): number {
  return minutesToOffset(minutesOfDay(now), HOUR_HEIGHT);
}

export function initialScrollTop(now: Date): number {
  return Math.max(0, nowLineOffset(now) - HOUR_HEIGHT * SCROLL_LEAD_HOURS);
}
