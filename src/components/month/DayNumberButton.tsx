import type { DayCell } from "@/domain/view";
import { dayTextColor } from "@/components/common/dayPalette";

function dayColor(cell: DayCell): string {
  if (!cell.inMonth) return "var(--text-faint)";
  return dayTextColor(cell);
}

function DayNumber({ cell }: { readonly cell: DayCell }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      {cell.isHoliday ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "var(--holiday-disc)",
            width: "calc(1.5em + 1px)",
            height: "calc(1.5em + 1px)",
          }}
        />
      ) : null}
      <span
        className={`relative ${cell.isToday ? "font-bold" : ""}`}
        style={{ color: dayColor(cell) }}
        {...(cell.isToday ? { "aria-current": "date" as const } : {})}
      >
        {cell.day}
      </span>
    </span>
  );
}

export interface GridStop {
  readonly index: number;
  readonly isTabStop: boolean;
}

function OpenDayButton({
  cell,
  month,
  onOpen,
  stop,
  describedBy,
}: {
  readonly cell: DayCell;
  readonly month: number;
  readonly onOpen: () => void;
  readonly stop: GridStop | undefined;
  readonly describedBy: string | undefined;
}) {
  return (
    <button
      type="button"
      aria-label={`${month}月${cell.day}日を開く`}
      aria-describedby={describedBy}
      {...(stop
        ? {
            "data-grid-index": stop.index,
            tabIndex: stop.isTabStop ? 0 : -1,
          }
        : {})}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      <DayNumber cell={cell} />
    </button>
  );
}

export function DayNumberOrButton({
  cell,
  month,
  onOpen,
  stop,
  describedBy,
}: {
  readonly cell: DayCell;
  readonly month: number | undefined;
  readonly onOpen: (() => void) | null;
  readonly stop: GridStop | undefined;
  readonly describedBy: string | undefined;
}) {
  if (!onOpen || month === undefined) return <DayNumber cell={cell} />;
  return (
    <OpenDayButton
      cell={cell}
      month={month}
      onOpen={onOpen}
      stop={stop}
      describedBy={describedBy}
    />
  );
}
