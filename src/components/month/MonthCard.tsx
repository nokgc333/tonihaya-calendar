"use client";

import { useState } from "react";
import type { DayCell, MonthView } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import type { CalendarEvent } from "@/domain/event";
import { DayCellView } from "@/components/month/DayCellView";
import { SIZE, type MonthCardSize } from "@/components/month/monthCardSize";
import { MonthCardHeader, WeekdayRow } from "@/components/month/MonthCardParts";
import { initialGridIndex, nextGridIndex } from "@/components/month/dayGridNav";
import {
  cellContext,
  DAYS_PER_WEEK,
  isPivotWeek,
  type CellContextInput,
} from "@/components/month/monthCells";

export type { MonthCardSize } from "@/components/month/monthCardSize";

const RESERVED_WEEK_ROWS = 6;

interface GridProps {
  readonly month: MonthView;
  readonly size: MonthCardSize;
  readonly spacious: boolean;
  readonly context: CellContextInput;
  readonly pivotDay?: CivilDate | null;
  readonly onDayClick?: (year: number, month: number, day: number) => void;
  readonly onEventSelect?: (id: string) => void;
}

interface Roving {
  readonly active: number;
}

interface CellSpot {
  readonly weekIndex: number;
  readonly cellIndex: number;
  readonly interactive: boolean;
}

function renderCell(
  props: GridProps,
  cell: DayCell,
  spot: CellSpot,
  roving: Roving,
) {
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
      gridStop={
        interactive
          ? { index: gridIndex, isTabStop: roving.active === gridIndex }
          : undefined
      }
    />
  );
}

function WeekRow({
  props,
  week,
  weekIndex,
  roving,
}: {
  readonly props: GridProps;
  readonly week: readonly DayCell[];
  readonly weekIndex: number;
  readonly roving: Roving;
}) {
  const { context, pivotDay } = props;
  return (
    <div
      className="relative isolate col-span-7 grid grid-cols-subgrid gap-px"
      style={{ background: "var(--border)" }}
    >
      {week.map((cell, ci) =>
        renderCell(
          props,
          cell,
          { weekIndex, cellIndex: ci, interactive: true },
          roving,
        ),
      )}
      {isPivotWeek(context, week, weekIndex, pivotDay) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-7 gap-px"
          style={{
            background: "var(--border)",
            viewTransitionName: "day-zoom",
          }}
        >
          {week.map((cell, ci) =>
            renderCell(
              props,
              cell,
              { weekIndex, cellIndex: ci, interactive: false },
              roving,
            ),
          )}
        </div>
      )}
    </div>
  );
}

function focusDayButton(grid: HTMLElement, index: number): void {
  grid.querySelector<HTMLElement>(`[data-grid-index="${index}"]`)?.focus();
}

function MonthGrid(props: GridProps) {
  const { month, size, spacious } = props;
  const cells = month.weeks.flat();
  const [active, setActive] = useState(() => initialGridIndex(cells));
  const roving: Roving = { active };

  const indexOf = (target: EventTarget): number | null => {
    const raw = (target as HTMLElement)
      .closest("[data-grid-index]")
      ?.getAttribute("data-grid-index");
    return raw == null ? null : Number(raw);
  };

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
      onFocus={(e) => {
        const index = indexOf(e.target);
        if (index !== null) setActive(index);
      }}
      onKeyDown={(e) => {
        const index = indexOf(e.target);
        if (index === null || e.altKey || e.ctrlKey || e.metaKey) return;
        const next = nextGridIndex(e.key, index, cells.length, DAYS_PER_WEEK);
        if (next === null) return;
        e.preventDefault();
        focusDayButton(e.currentTarget, next);
      }}
    >
      {month.weeks.map((week, wi) => (
        <WeekRow
          key={wi}
          props={props}
          week={week}
          weekIndex={wi}
          roving={roving}
        />
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
        pivotDay={pivotDay}
        onDayClick={onDayClick}
        onEventSelect={onEventSelect}
      />
    </div>
  );
}
