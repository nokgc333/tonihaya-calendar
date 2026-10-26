"use client";

import type { Countdown } from "@/domain/countdown";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import type { JumpLevel } from "@/domain/view";
import type { createCalendarNavigation } from "@/hooks/calendarNavigation";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody, type OverviewLayout } from "@/components/OverviewBody";
import { MonthDetail } from "@/components/MonthDetail";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";

type Navigation = ReturnType<typeof createCalendarNavigation>;

export interface ScreenShared {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly countdowns: Countdown | null;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
  readonly onJump: (level: JumpLevel) => void;
}

const FULL_HEIGHT_MAIN =
  "mx-auto flex h-dvh max-w-[1600px] min-w-[375px] flex-col px-4 py-5";

function FullHeightScreen({
  shared,
  children,
}: {
  readonly shared: ScreenShared;
  readonly children: React.ReactNode;
}) {
  return (
    <main className={FULL_HEIGHT_MAIN}>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <TodayHeader today={shared.today} countdowns={shared.countdowns} />
        {children}
      </div>
    </main>
  );
}

export function DayScreen({
  shared,
  month,
  day,
  nav,
}: {
  readonly shared: ScreenShared;
  readonly month: number;
  readonly day: number;
  readonly nav: Navigation["day"];
}) {
  return (
    <FullHeightScreen shared={shared}>
      <DayView
        year={shared.year}
        month={month}
        day={day}
        today={shared.today}
        onBack={nav.onBack}
        onDayChange={nav.onDayChange}
        onJump={shared.onJump}
        weekStart={shared.weekStart}
        onWeekStartChange={shared.onWeekStartChange}
        jumpPivot={shared.jumpPivot}
      />
    </FullHeightScreen>
  );
}

export function WeekScreen({
  shared,
  month,
  day,
  dayPivot,
  pivotDay,
  nav,
}: {
  readonly shared: ScreenShared;
  readonly month: number;
  readonly day: number;
  readonly dayPivot: CivilDate | null;
  readonly pivotDay: CivilDate | null;
  readonly nav: Navigation["week"];
}) {
  return (
    <FullHeightScreen shared={shared}>
      <WeekView
        year={shared.year}
        month={month}
        day={day}
        today={shared.today}
        onBack={nav.onBack}
        onWeekChange={nav.onWeekChange}
        onDayOpen={nav.onDayOpen}
        dayPivot={dayPivot}
        pivotDay={pivotDay}
        onJump={shared.onJump}
        weekStart={shared.weekStart}
        onWeekStartChange={shared.onWeekStartChange}
        jumpPivot={shared.jumpPivot}
      />
    </FullHeightScreen>
  );
}

export function OverviewScreen({
  shared,
  layout,
  onLayoutChange,
  nav,
}: {
  readonly shared: ScreenShared;
  readonly layout: OverviewLayout;
  readonly onLayoutChange: (layout: OverviewLayout) => void;
  readonly nav: Navigation["overview"];
}) {
  return (
    <main className="mx-auto max-w-[1600px] min-w-[375px] px-4 py-5">
      <div className="mx-auto w-full max-w-[1256px] min-[1600px]:max-w-[1600px]">
        <TodayHeader today={shared.today} countdowns={shared.countdowns} />
        <OverviewBody
          year={shared.year}
          today={shared.today}
          layout={layout}
          onYearChange={nav.onYearChange}
          onMonthClick={nav.onMonthClick}
          onLayoutChange={onLayoutChange}
          onJump={shared.onJump}
          weekStart={shared.weekStart}
          onWeekStartChange={shared.onWeekStartChange}
          jumpPivot={shared.jumpPivot}
        />
      </div>
    </main>
  );
}

export function MonthScreen({
  shared,
  month,
  pivotDay,
  nav,
}: {
  readonly shared: ScreenShared;
  readonly month: number;
  readonly pivotDay: CivilDate | null;
  readonly nav: Navigation["month"];
}) {
  return (
    <main className="mx-auto max-w-[1600px] min-w-[375px] px-4 py-5">
      <div className="w-full">
        <TodayHeader today={shared.today} countdowns={shared.countdowns} />
        <MonthDetail
          year={shared.year}
          month={month}
          today={shared.today}
          countdowns={shared.countdowns}
          onBack={nav.onBack}
          onMonthChange={nav.onMonthChange}
          onDayClick={nav.onDayClick}
          pivotDay={pivotDay}
          onJump={shared.onJump}
          weekStart={shared.weekStart}
          onWeekStartChange={shared.onWeekStartChange}
          jumpPivot={shared.jumpPivot}
        />
      </div>
    </main>
  );
}
