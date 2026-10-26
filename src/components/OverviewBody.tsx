"use client";

import { buildYearView } from "@/domain/view";
import type { JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { MonthCard } from "@/components/MonthCard";
import { HolidayList } from "@/components/HolidayList";
import { OverviewNav } from "@/components/OverviewNav";
import type { OverviewLayout } from "@/components/OverviewControls";
import { useEvents } from "@/hooks/useEvents";

export type { OverviewLayout } from "@/components/OverviewControls";

export function OverviewBody({
  year,
  today,
  layout,
  onYearChange,
  onMonthClick,
  onLayoutChange,
  onJump,
  weekStart,
  onWeekStartChange,
  jumpPivot,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly layout: OverviewLayout;
  readonly onYearChange: (year: number) => void;
  readonly onMonthClick: (month: number) => void;
  readonly onLayoutChange: (layout: OverviewLayout) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}) {
  const view = buildYearView(year, today, { weekStart });
  const { events } = useEvents();
  const zoomClass = layout === "4x3" ? "min-[1288px]:[zoom:1.34]" : "";

  return (
    <>
      <OverviewNav
        year={year}
        today={today}
        layout={layout}
        weekStart={weekStart}
        onYearChange={onYearChange}
        onLayoutChange={onLayoutChange}
        onJump={onJump}
        onWeekStartChange={onWeekStartChange}
      />
      <div className="flex gap-6">
        <div className="w-full min-[1600px]:w-[1256px] min-[1600px]:shrink-0">
          <div className="flex flex-wrap justify-center gap-3">
            {view.months.map((m) => (
              <div key={m.month} className={`w-[305px] ${zoomClass}`}>
                <MonthCard
                  month={m}
                  year={year}
                  weekStart={weekStart}
                  viewTransitionName={
                    jumpPivot ? undefined : `month-${m.month}`
                  }
                  jumpDay={jumpPivot}
                  events={events}
                  onClick={() => onMonthClick(m.month)}
                />
              </div>
            ))}
          </div>
        </div>
        <aside className="hidden min-w-[280px] flex-1 min-[1600px]:block">
          <HolidayList year={year} today={today} onMonthClick={onMonthClick} />
        </aside>
      </div>
    </>
  );
}
