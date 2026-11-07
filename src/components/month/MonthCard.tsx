"use client";

import type { DayCell, MonthView } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import type { CalendarEvent } from "@/domain/event";
import { DayCellView } from "@/components/month/DayCellView";
import { SIZE, type MonthCardSize } from "@/components/month/monthCardSize";
import { MonthCardHeader, WeekdayRow } from "@/components/month/MonthCardParts";
import {
  cellContext,
  DAYS_PER_WEEK,
  type CellContextInput,
} from "@/components/month/monthCells";

export type { MonthCardSize } from "@/components/month/monthCardSize";

const RESERVED_WEEK_ROWS = 6;

interface GridProps {
  readonly month: MonthView;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly context: CellContextInput;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly onEventSelect?: (id: string) => void;
}

interface CellSpot {
  readonly weekIndex: number;
  readonly cellIndex: number;
  readonly interactive: boolean;
}

function renderCell(props: GridProps, cell: DayCell, spot: CellSpot) {
  const { size, spacious, context, onDayClick, onEventSelect } = props;
  const { weekIndex, cellIndex, interactive } = spot;
  const gridIndex = weekIndex * DAYS_PER_WEEK + cellIndex;
  const { resolved, isJump, dayEvents } = cellContext(
    context,
    cell,
    gridIndex,
    interactive,
  );
  return (
    <DayCellView
      key={cellIndex}
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
}

function WeekRow({
  props,
  week,
  weekIndex,
}: {
  readonly props: GridProps;
  readonly week: readonly DayCell[];
  readonly weekIndex: number;
}) {
  return (
    <div
      className="relative isolate col-span-7 grid grid-cols-subgrid gap-px"
      style={{ background: "var(--border)" }}
    >
      {week.map((cell, ci) =>
        renderCell(props, cell, {
          weekIndex,
          cellIndex: ci,
          interactive: true,
        }),
      )}
    </div>
  );
}

function MonthGrid(props: GridProps) {
  const { month, size, spacious } = props;
  return (
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
      {month.weeks.map((week, wi) => (
        <WeekRow key={wi} props={props} week={week} weekIndex={wi} />
      ))}
    </div>
  );
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
  readonly jumpDay?: CivilDate | null;
  readonly events?: readonly CalendarEvent[];
  readonly onEventSelect?: (id: string) => void;
}) {
  const context: CellContextInput = {
    flat: month.weeks.flat(),
    year,
    month: month.month,
    jumpDay,
    events,
  };
  return (
    <div
      role="group"
      aria-label={month.labelJa}
      className={`rounded-xl border p-3 text-left ${onClick ? "cursor-pointer transition-colors hover:border-[var(--border-strong)]" : ""}`}
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        viewTransitionName,
      }}
      onClick={onClick}
    >
      <MonthCardHeader month={month} size={size} onOpen={onClick} />
      <WeekdayRow weekStart={weekStart} size={size} />
      <MonthGrid
        month={month}
        size={size}
        spacious={spacious}
        context={context}
        onDayClick={onDayClick}
        onEventSelect={onEventSelect}
      />
    </div>
  );
}
