import type { CivilDate } from "@/domain/shared/date";
import type { CalendarEvent } from "@/domain/event";
import { eventsForDay, sortForDay } from "@/domain/event";
import type { DayCell } from "@/domain/view";

export const DAYS_PER_WEEK = 7;
const JANUARY = 1;
const DECEMBER = 12;

export interface CellMonth {
  readonly year: number;
  readonly month: number;
}

export function resolveCellMonth(
  cells: readonly DayCell[],
  index: number,
  year: number,
  month: number,
): CellMonth {
  if (cells[index].inMonth) return { year, month };
  const firstInMonthIdx = cells.findIndex((c) => c.inMonth);
  if (index < firstInMonthIdx) {
    return month === JANUARY
      ? { year: year - 1, month: DECEMBER }
      : { year, month: month - 1 };
  }
  return month === DECEMBER
    ? { year: year + 1, month: JANUARY }
    : { year, month: month + 1 };
}

const isSameDay = (resolved: CellMonth, day: number, target: CivilDate) =>
  resolved.year === target.year &&
  resolved.month === target.month &&
  day === target.day;

export interface CellContextInput {
  readonly flat: readonly DayCell[];
  readonly year: number | undefined;
  readonly month: number;
  readonly jumpDay: CivilDate | null | undefined;
  readonly events: readonly CalendarEvent[] | undefined;
}

export interface CellContext {
  readonly resolved: CellMonth | undefined;
  readonly isJump: boolean;
  readonly dayEvents: readonly CalendarEvent[] | undefined;
}

export function isPivotWeek(
  { flat, year, month }: CellContextInput,
  week: readonly DayCell[],
  weekIndex: number,
  pivotDay: CivilDate | null | undefined,
): boolean {
  if (year === undefined || !pivotDay) return false;
  return week.some((cell, ci) =>
    isSameDay(
      resolveCellMonth(flat, weekIndex * DAYS_PER_WEEK + ci, year, month),
      cell.day,
      pivotDay,
    ),
  );
}

export function cellContext(
  input: CellContextInput,
  cell: DayCell,
  index: number,
  interactive: boolean,
): CellContext {
  const { flat, year, month, jumpDay, events } = input;
  const resolved =
    year !== undefined ? resolveCellMonth(flat, index, year, month) : undefined;
  const isJump =
    interactive &&
    !!jumpDay &&
    cell.inMonth &&
    !!resolved &&
    isSameDay(resolved, cell.day, jumpDay);
  const dayEvents =
    interactive && events && cell.inMonth && resolved
      ? sortForDay(
          eventsForDay(events, {
            year: resolved.year,
            month: resolved.month,
            day: cell.day,
          }),
        )
      : undefined;
  return { resolved, isJump, dayEvents };
}
