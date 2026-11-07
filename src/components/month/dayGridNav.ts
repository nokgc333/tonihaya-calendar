const MOVES: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
};

interface CellFlags {
  readonly inMonth: boolean;
  readonly isToday: boolean;
}

export function nextGridIndex(
  key: string,
  index: number,
  total: number,
  columns: number,
): number | null {
  const last = total - 1;
  const rowStart = index - (index % columns);
  const target =
    key in MOVES
      ? index + MOVES[key]
      : key === "ArrowUp"
        ? index - columns
        : key === "ArrowDown"
          ? index + columns
          : key === "Home"
            ? rowStart
            : key === "End"
              ? Math.min(rowStart + columns - 1, last)
              : null;
  if (target === null) return null;
  return target < 0 || target > last ? index : target;
}

export function initialGridIndex(cells: readonly CellFlags[]): number {
  const today = cells.findIndex((c) => c.inMonth && c.isToday);
  if (today >= 0) return today;
  return Math.max(
    0,
    cells.findIndex((c) => c.inMonth),
  );
}
