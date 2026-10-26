"use client";

import { useRef } from "react";
import { buildDayView, type JumpLevel } from "@/domain/view";
import { fromEpochDay, toEpochDay, type CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import type { WeekDay } from "@/domain/view";
import { useEvents } from "@/hooks/useEvents";
import { useEventEditor } from "@/hooks/useEventEditor";
import { dayTextColor } from "@/components/dayPalette";
import { WEEKDAY_JA } from "@/components/weekdays";
import { AllDayCell, AllDayLabel } from "@/components/AllDayCell";
import { DayNav } from "@/components/DayNav";
import { DayHourGrid } from "@/components/DayHourGrid";
import {
  useEscapeToBack,
  useScrollToNow,
} from "@/components/useTimelineEffects";
import { DAY_GRID_COLS, nowLineOffset } from "@/components/weekLayout";

function DayHeading({
  day,
  jumpPivot,
}: {
  readonly day: WeekDay;
  readonly jumpPivot: CivilDate | null;
}) {
  return (
    <div
      className="sticky top-0 z-10 grid min-h-[54.5px] shrink-0 items-center py-1.5"
      style={{
        gridTemplateColumns: DAY_GRID_COLS,
        background: "var(--surface)",
        viewTransitionName: jumpPivot ? undefined : "hour-zoom",
      }}
    >
      <div />
      <div
        className="text-center text-lg font-bold tabular-nums"
        style={{ color: dayTextColor(day) }}
      >
        {day.year}年{day.month}月{day.day}日（{WEEKDAY_JA[day.weekday]}）
      </div>
    </div>
  );
}

interface DayViewProps {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly today: CivilDate | null;
  readonly onBack: () => void;
  readonly onDayChange: (year: number, month: number, day: number) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}

export function DayView(props: DayViewProps) {
  const { year, month, day, today, onBack, onDayChange, jumpPivot } = props;
  const date = { year, month, day };
  const { day: d } = buildDayView(year, month, day, today);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { events } = useEvents();
  const { openEdit } = useEventEditor();

  useEscapeToBack(onBack);
  useScrollToNow(bodyRef, d.isToday ? 0 : -1, date);

  const shiftDay = (delta: number): void => {
    const next = fromEpochDay(toEpochDay(year, month, day) + delta);
    onDayChange(next.year, next.month, next.day);
  };

  return (
    <>
      <DayNav
        date={date}
        weekday={d.weekday}
        weekStart={props.weekStart}
        onBack={onBack}
        onShift={shiftDay}
        onJump={props.onJump}
        onWeekStartChange={props.onWeekStartChange}
      />
      <div
        className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col rounded-md border"
        style={{
          borderColor: "var(--border)",
          viewTransitionName: jumpPivot ? "jump-zoom" : undefined,
        }}
      >
        <DayHeading day={d} jumpPivot={jumpPivot} />
        <div
          className="grid shrink-0 border-y"
          style={{
            gridTemplateColumns: DAY_GRID_COLS,
            borderColor: "var(--border-strong)",
          }}
        >
          <AllDayLabel />
          <AllDayCell day={d} events={events} onSelect={openEdit} />
        </div>
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto">
          <DayHourGrid
            day={d}
            nowOffset={d.isToday ? nowLineOffset(new Date()) : 0}
            onSelect={openEdit}
          />
        </div>
      </div>
    </>
  );
}
