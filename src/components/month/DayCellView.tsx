import type { DayCell } from "@/domain/view";
import type { CalendarEvent } from "@/domain/event";
import { dayBgColor, dayTextColor } from "@/components/common/dayPalette";
import { EventChip } from "@/components/event/EventChip";
import { eventColor } from "@/components/event/eventColors";
import { SIZE, type MonthCardSize } from "@/components/month/monthCardSize";

const MAX_CHIPS = 3;
const MAX_DOTS = 6;

function dayColor(cell: DayCell): string {
  if (!cell.inMonth) return "var(--text-faint)";
  return dayTextColor(cell);
}

function dayBg(cell: DayCell): string {
  if (!cell.inMonth) return "var(--surface)";
  return dayBgColor(cell);
}

function cellStyle(cell: DayCell, jump: boolean): React.CSSProperties {
  const todayRing = cell.isToday
    ? { boxShadow: "inset 0 0 0 1.5px var(--today-bg)" }
    : {};
  return {
    background: dayBg(cell),
    ...(jump ? { viewTransitionName: "jump-zoom" } : null),
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

function EventChips({
  dayEvents,
  onEventSelect,
}: {
  readonly dayEvents: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
}) {
  const overflow = dayEvents.length - MAX_CHIPS;
  return (
    <div className="mt-1.5 min-h-0 space-y-0.5 px-0.5">
      {dayEvents.slice(0, MAX_CHIPS).map((e) => (
        <EventChip key={e.id} event={e} onSelect={onEventSelect} />
      ))}
      {overflow > 0 ? (
        <div
          className="px-1 text-[10px]"
          style={{ color: "var(--text-muted)" }}
        >
          +{overflow}件
        </div>
      ) : null}
    </div>
  );
}

function EventDots({
  dayEvents,
}: {
  readonly dayEvents: readonly CalendarEvent[];
}) {
  const dotOverflow = dayEvents.length > MAX_DOTS;
  const shownDots = dotOverflow
    ? dayEvents.slice(0, MAX_DOTS - 1)
    : dayEvents.slice(0, MAX_DOTS);
  return (
    <div
      className="pointer-events-none absolute grid grid-flow-col grid-rows-3 justify-end gap-x-[1px] gap-y-[2px]"
      style={{ top: "5px", left: "calc(50% + 9px)", width: "9px" }}
    >
      {shownDots.map((e) => (
        <span
          key={e.id}
          className="h-1 w-1 rounded-full"
          style={{ background: eventColor(e.colorKey).border }}
        />
      ))}
      {dotOverflow ? (
        <span
          className="relative flex h-1 w-1 items-center justify-center text-[8px] leading-none"
          style={{ color: "var(--text-muted)", top: "0.5px" }}
        >
          ＋
        </span>
      ) : null}
    </div>
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

interface GridStop {
  readonly index: number;
  readonly isTabStop: boolean;
}

function OpenDayButton({
  cell,
  month,
  onOpen,
  stop,
}: {
  readonly cell: DayCell;
  readonly month: number;
  readonly onOpen: () => void;
  readonly stop: GridStop | undefined;
}) {
  return (
    <button
      type="button"
      aria-label={`${month}月${cell.day}日を開く`}
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

function DayNumberOrButton({
  cell,
  month,
  onOpen,
  stop,
}: {
  readonly cell: DayCell;
  readonly month: number | undefined;
  readonly onOpen: (() => void) | null;
  readonly stop: GridStop | undefined;
}) {
  if (!onOpen || month === undefined) return <DayNumber cell={cell} />;
  return (
    <OpenDayButton cell={cell} month={month} onOpen={onOpen} stop={stop} />
  );
}

interface DayCellViewProps {
  readonly cell: DayCell;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly cellYear?: number;
  readonly cellMonth?: number;
  readonly jump: boolean;
  readonly dayEvents?: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
  readonly gridStop?: GridStop;
}

export function DayCellView({
  cell,
  size,
  spacious,
  onDayClick,
  cellYear,
  cellMonth,
  jump,
  dayEvents = [],
  onEventSelect,
  gridStop,
}: DayCellViewProps) {
  const s = SIZE[size];
  const onOpen = dayOpener(onDayClick, cellYear, cellMonth, cell.day);
  const handlers = onOpen ? { onClick: onOpen } : {};
  const clickable = onOpen ? "cursor-pointer hover:brightness-95" : "";
  const number = (
    <DayNumberOrButton
      cell={cell}
      month={cellMonth}
      onOpen={onOpen}
      stop={gridStop}
    />
  );
  const style = cellStyle(cell, jump);
  const hasEvents = cell.inMonth && dayEvents.length > 0;

  if (spacious && hasEvents) {
    return (
      <div
        className={`flex h-full flex-col overflow-hidden ${clickable} ${s.dayText} leading-none tabular-nums`}
        style={style}
        {...handlers}
      >
        <div className="flex justify-center pt-[7px]">{number}</div>
        <EventChips dayEvents={dayEvents} onEventSelect={onEventSelect} />
      </div>
    );
  }

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
      {!spacious && hasEvents ? <EventDots dayEvents={dayEvents} /> : null}
    </div>
  );
}
