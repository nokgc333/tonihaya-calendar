import type { DayCell, MonthView } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import type { CalendarEvent } from "@/domain/event";
import { eventsForDay, sortForDay } from "@/domain/event";
import { dayBgColor, dayTextColor } from "@/components/dayPalette";
import { WEEKDAY_JA } from "@/components/weekdays";
import { EventChip } from "@/components/EventChip";
import { eventColor } from "@/components/eventColors";

const RESERVED_WEEK_ROWS = 6;

export type MonthCardSize = "sm" | "lg";
const SIZE = {
  sm: {
    row: "1.5rem",
    dayText: "text-[11px]",
    circle: "h-6 w-6",
    weekday: "text-[10px]",
  },
  lg: {
    row: "7.59375rem",
    dayText: "text-base",
    circle: "h-9 w-9",
    weekday: "text-xs",
  },
} as const;

function weekdayHeader(weekStart: WeekStart): readonly string[] {
  return weekStart === "mon"
    ? [...WEEKDAY_JA.slice(1), WEEKDAY_JA[0]]
    : WEEKDAY_JA;
}

function dayColor(cell: DayCell): string {
  if (!cell.inMonth) return "var(--text-faint)";
  return dayTextColor(cell);
}

function dayBg(cell: DayCell): string {
  if (!cell.inMonth) return "var(--surface)";
  return dayBgColor(cell);
}

function DayCellView({
  cell,
  size,
  spacious,
  onDayClick,
  cellYear,
  cellMonth,
  jump,
  dayEvents = [],
  onEventSelect,
}: {
  readonly cell: DayCell;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly cellYear?: number;
  readonly cellMonth?: number;
  readonly jump: boolean;
  readonly dayEvents?: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
}) {
  const s = SIZE[size];
  const vAlign = spacious ? "items-start pt-[7px]" : "items-start pt-[5px]";
  const clickable =
    onDayClick && cellYear !== undefined && cellMonth !== undefined
      ? "cursor-pointer hover:brightness-95"
      : "";
  const base = `flex h-full justify-center ${vAlign} ${clickable} ${s.dayText} leading-none tabular-nums`;
  const bgStyle = { background: dayBg(cell) };
  const zoomStyle = jump ? { viewTransitionName: "jump-zoom" } : null;
  const handlers =
    onDayClick && cellYear !== undefined && cellMonth !== undefined
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick: () => onDayClick(cellYear, cellMonth, cell.day),
          onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onDayClick(cellYear, cellMonth, cell.day);
            }
          },
        }
      : {};

  const numberNode = (
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
  const todayRing = cell.isToday
    ? { boxShadow: "inset 0 0 0 1.5px var(--today-bg)" }
    : {};

  const MAX_CHIPS = 3;
  const showChips = spacious && cell.inMonth && dayEvents.length > 0;
  if (showChips) {
    const overflow = dayEvents.length - MAX_CHIPS;
    return (
      <div
        className={`flex h-full flex-col overflow-hidden ${clickable} ${s.dayText} leading-none tabular-nums`}
        style={{ ...bgStyle, ...zoomStyle, ...todayRing }}
        {...handlers}
      >
        <div className="flex justify-center pt-[7px]">{numberNode}</div>
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
      </div>
    );
  }

  const showDots = !spacious && cell.inMonth && dayEvents.length > 0;
  const MAX_DOTS = 6;
  const dotOverflow = dayEvents.length > MAX_DOTS;
  const shownDots = dotOverflow
    ? dayEvents.slice(0, MAX_DOTS - 1)
    : dayEvents.slice(0, MAX_DOTS);

  return (
    <div
      className={`relative ${base}`}
      style={{
        ...bgStyle,
        ...zoomStyle,
        ...todayRing,
        opacity: cell.inMonth ? 1 : 0.55,
      }}
      title={cell.holidayName}
      {...handlers}
    >
      {numberNode}
      {showDots ? (
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
      ) : null}
    </div>
  );
}

function resolveCellMonth(
  cells: readonly DayCell[],
  index: number,
  year: number,
  month: number,
): { readonly year: number; readonly month: number } {
  if (cells[index].inMonth) return { year, month };
  const firstInMonthIdx = cells.findIndex((c) => c.inMonth);
  if (index < firstInMonthIdx) {
    return month === 1
      ? { year: year - 1, month: 12 }
      : { year, month: month - 1 };
  }
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}

export function MonthCard({
  month,
  weekStart,
  onClick,
  viewTransitionName,
  size = "sm",
  spacious = false,
  onDayClick,
  year,
  pivotDay,
  jumpDay,
  events,
  onEventSelect,
}: {
  readonly month: MonthView;
  readonly weekStart: WeekStart;
  readonly onClick?: () => void;
  readonly viewTransitionName?: string;
  readonly size?: MonthCardSize;
  readonly spacious?: boolean;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly year?: number;
  readonly pivotDay?: CivilDate | null;
  readonly jumpDay?: CivilDate | null;
  readonly events?: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
}) {
  return (
    <section
      className={`rounded-xl border p-3 text-left ${onClick ? "cursor-pointer transition-colors hover:border-[var(--border-strong)]" : ""}`}
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        viewTransitionName,
      }}
      onClick={onClick}
      {...(onClick
        ? {
            role: "button",
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      <header
        className={`flex items-baseline gap-2 ${size === "lg" ? "mb-3" : "mb-2"}`}
      >
        <h2 className={`font-bold ${size === "lg" ? "text-2xl" : "text-lg"}`}>
          {month.labelJa}
        </h2>
        {size === "lg" ? (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {month.labelEn} / {month.labelWafu}
          </span>
        ) : (
          <>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {month.labelEn}
            </span>
            <span
              className="ml-auto text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {month.labelWafu}
            </span>
          </>
        )}
      </header>

      <div className="grid grid-cols-7 pb-1.5">
        {weekdayHeader(weekStart).map((label, i) => (
          <div
            key={label}
            className={`flex h-5 items-center justify-center ${SIZE[size].weekday} font-medium`}
            style={{
              color:
                i === (weekStart === "mon" ? 6 : 0)
                  ? "var(--accent-red)"
                  : i === (weekStart === "mon" ? 5 : 6)
                    ? "var(--accent-sat)"
                    : "var(--text-muted)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 gap-px border ${spacious ? "aspect-[7/5.3]" : ""}`}
        style={{
          gridTemplateRows: spacious
            ? `repeat(${RESERVED_WEEK_ROWS}, minmax(0, 1fr))`
            : `repeat(${RESERVED_WEEK_ROWS}, ${SIZE[size].row})`,
          background: "var(--border)",
          borderColor: "var(--border)",
        }}
      >
        {(() => {
          const flat = month.weeks.flat();
          const isPivotWeek = (week: readonly DayCell[], wi: number): boolean =>
            year !== undefined &&
            !!pivotDay &&
            week.some((cell, ci) => {
              const r = resolveCellMonth(flat, wi * 7 + ci, year, month.month);
              return (
                r.year === pivotDay.year &&
                r.month === pivotDay.month &&
                cell.day === pivotDay.day
              );
            });
          const renderCell = (
            cell: DayCell,
            wi: number,
            ci: number,
            interactive: boolean,
          ) => {
            const i = wi * 7 + ci;
            const resolved =
              year !== undefined
                ? resolveCellMonth(flat, i, year, month.month)
                : undefined;
            const isJump =
              interactive &&
              !!jumpDay &&
              cell.inMonth &&
              !!resolved &&
              resolved.year === jumpDay.year &&
              resolved.month === jumpDay.month &&
              cell.day === jumpDay.day;
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
            return (
              <DayCellView
                key={ci}
                cell={cell}
                size={size}
                spacious={spacious}
                onDayClick={interactive ? onDayClick : undefined}
                cellYear={resolved?.year}
                cellMonth={resolved?.month}
                jump={isJump}
                dayEvents={dayEvents}
                onEventSelect={onEventSelect}
              />
            );
          };
          return month.weeks.map((week, wi) => (
            <div
              key={wi}
              className="relative isolate col-span-7 grid grid-cols-subgrid gap-px"
              style={{ background: "var(--border)" }}
            >
              {week.map((cell, ci) => renderCell(cell, wi, ci, true))}
              {isPivotWeek(week, wi) && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-7 gap-px"
                  style={{
                    background: "var(--border)",
                    viewTransitionName: "day-zoom",
                  }}
                >
                  {week.map((cell, ci) => renderCell(cell, wi, ci, false))}
                </div>
              )}
            </div>
          ));
        })()}
      </div>
    </section>
  );
}
