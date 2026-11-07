import type { DayCell } from "@/domain/view";

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
