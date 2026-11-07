import type { DayCell } from "@/domain/view";
import { dayBgColor, dayTextColor } from "@/components/common/dayPalette";
import { SIZE, type MonthCardSize } from "@/components/month/monthCardSize";

function dayColor(cell: DayCell): string {
  if (!cell.inMonth) return "var(--text-faint)";
  return dayTextColor(cell);
}

function dayBg(cell: DayCell): string {
  if (!cell.inMonth) return "var(--surface)";
  return dayBgColor(cell);
}

function cellStyle(cell: DayCell): React.CSSProperties {
  const todayRing = cell.isToday
    ? { boxShadow: "inset 0 0 0 1.5px var(--today-bg)" }
    : {};
  return {
    background: dayBg(cell),
    ...todayRing,
  };
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

function dayOpener(
  onDayClick: DayCellViewProps["onDayClick"],
  cellYear: number | undefined,
  cellMonth: number | undefined,
  day: number,
): (() => void) | null {
  if (!onDayClick || cellYear === undefined || cellMonth === undefined) {
    return null;
  }
  return () => onDayClick(cellYear, cellMonth, day);
}

function OpenDayButton({
  cell,
  month,
  onOpen,
}: {
  readonly cell: DayCell;
  readonly month: number;
  readonly onOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${month}月${cell.day}日を開く`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      <DayNumber cell={cell} />
    </button>
  );
}

function DayNumberOrButton({
  cell,
  month,
  onOpen,
}: {
  readonly cell: DayCell;
  readonly month: number | undefined;
  readonly onOpen: (() => void) | null;
}) {
  if (!onOpen || month === undefined) return <DayNumber cell={cell} />;
  return <OpenDayButton cell={cell} month={month} onOpen={onOpen} />;
}

interface DayCellViewProps {
  readonly cell: DayCell;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly cellYear?: number;
  readonly cellMonth?: number;
}

export function DayCellView({
  cell,
  size,
  spacious,
  onDayClick,
  cellYear,
  cellMonth,
}: DayCellViewProps) {
  const s = SIZE[size];
  const onOpen = dayOpener(onDayClick, cellYear, cellMonth, cell.day);
  const handlers = onOpen ? { onClick: onOpen } : {};
  const clickable = onOpen ? "cursor-pointer hover:brightness-95" : "";
  const number = (
    <DayNumberOrButton cell={cell} month={cellMonth} onOpen={onOpen} />
  );
  const style = cellStyle(cell);
  const vAlign = spacious ? "items-start pt-[7px]" : "items-start pt-[5px]";
  const base = `flex h-full justify-center ${vAlign} ${clickable} ${s.dayText} leading-none tabular-nums`;
  return (
    <div
      className={`relative ${base}`}
      style={style}
      title={cell.holidayName}
      {...handlers}
    >
      {number}
    </div>
  );
}
