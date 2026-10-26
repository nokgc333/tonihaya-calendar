"use client";

import { useRef } from "react";
import { buildWeekView, type JumpLevel } from "@/domain/view";
import { fromEpochDay, toEpochDay, type CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { useEvents } from "@/hooks/useEvents";
import { useEventEditor } from "@/hooks/useEventEditor";
import { WeekNav } from "@/components/WeekNav";
import { WeekDayHeaders } from "@/components/WeekDayHeaders";
import { WeekAllDayRow } from "@/components/WeekAllDayRow";
import { WeekHourGrid } from "@/components/WeekHourGrid";
import {
  useEscapeToBack,
  useScrollToNow,
} from "@/components/useTimelineEffects";
import {
  isSameDay,
  nowLineOffset,
  weekRangeLabel,
} from "@/components/weekLayout";

const DAYS_PER_WEEK = 7;

interface WeekViewProps {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly today: CivilDate | null;
  readonly onBack: () => void;
  readonly onWeekChange: (year: number, month: number, day: number) => void;
  readonly onDayOpen: (year: number, month: number, day: number) => void;
  readonly dayPivot: CivilDate | null;
  readonly pivotDay: CivilDate | null;
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}

export function WeekView(props: WeekViewProps) {
  const { year, month, day, today, onBack, onWeekChange, onDayOpen } = props;
  const { dayPivot, pivotDay, jumpPivot, weekStart } = props;
  const date = { year, month, day };
  const week = buildWeekView(date, today, { weekStart });
  const bodyRef = useRef<HTMLDivElement>(null);
  const { events } = useEvents();
  const { openEdit } = useEventEditor();
  const todayIndex = week.days.findIndex((d) => d.isToday);

  useEscapeToBack(onBack);
  useScrollToNow(bodyRef, todayIndex, date);

  const shiftWeek = (deltaWeeks: number): void => {
    const next = fromEpochDay(
      toEpochDay(year, month, day) + deltaWeeks * DAYS_PER_WEEK,
    );
    onWeekChange(next.year, next.month, next.day);
  };

  return (
    <>
      <WeekNav
        rangeLabel={weekRangeLabel(week.days[0], week.days[DAYS_PER_WEEK - 1])}
        date={date}
        weekStart={weekStart}
        onBack={onBack}
        onShift={shiftWeek}
        onJump={props.onJump}
        onWeekStartChange={props.onWeekStartChange}
      />
      <div
        className="mx-auto flex min-h-0 w-full max-w-[1256px] flex-1 flex-col overflow-x-auto rounded-md border"
        style={{ borderColor: "var(--border)" }}
      >
        <WeekDayHeaders
          days={week.days}
          isDayZoom={
            pivotDay !== null && dayPivot === null && jumpPivot === null
          }
          isPivot={(d) => isSameDay(dayPivot, d)}
          isJump={(d) => isSameDay(jumpPivot, d)}
          onOpen={onDayOpen}
        />
        <WeekAllDayRow days={week.days} events={events} onSelect={openEdit} />
        <div
          ref={bodyRef}
          tabIndex={0}
          role="region"
          aria-label="時間ごとの予定"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <WeekHourGrid
            days={week.days}
            todayIndex={todayIndex}
            nowOffset={todayIndex >= 0 ? nowLineOffset(new Date()) : 0}
            onOpen={onDayOpen}
            onSelect={openEdit}
          />
        </div>
      </div>
    </>
  );
}
