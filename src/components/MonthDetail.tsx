"use client";

import { buildMonthDetail, type JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { Countdown } from "@/domain/countdown";
import type { WeekStart } from "@/domain/calendar";
import { MonthCard } from "@/components/MonthCard";
import { CountdownChips } from "@/components/CountdownChips";
import { MonthDetailNav } from "@/components/MonthDetailNav";
import { MonthSummaryPanel } from "@/components/MonthSummaryPanel";
import { useEscapeToBack } from "@/components/useTimelineEffects";
import { defaultEventDate, neighborMonth } from "@/components/monthDetailModel";
import { useEvents } from "@/hooks/useEvents";
import { useEventEditor } from "@/hooks/useEventEditor";

const SIDE_BY_SIDE = "min-[1168px]:flex-row min-[1168px]:items-start";

interface MonthDetailProps {
  readonly year: number;
  readonly month: number;
  readonly today: CivilDate | null;
  readonly countdowns: Countdown | null;
  readonly onBack: () => void;
  readonly onMonthChange: (year: number, month: number) => void;
  readonly onDayClick: (year: number, month: number, day: number) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly pivotDay?: CivilDate | null;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}

export function MonthDetail(props: MonthDetailProps) {
  const { year, month, today, countdowns, onBack, weekStart, jumpPivot } =
    props;
  useEscapeToBack(onBack);

  const detail = buildMonthDetail(year, month, today, { weekStart });
  const { events } = useEvents();
  const { openEdit } = useEventEditor();

  const shiftMonth = (delta: -1 | 1): void => {
    const next = neighborMonth({ year, month }, delta);
    props.onMonthChange(next.year, next.month);
  };

  return (
    <>
      <MonthDetailNav
        year={year}
        month={month}
        addDate={defaultEventDate(today, { year, month })}
        weekStart={weekStart}
        onBack={onBack}
        onShift={shiftMonth}
        onJump={props.onJump}
        onWeekStartChange={props.onWeekStartChange}
      />
      <div
        className={`mx-auto flex w-full max-w-[1256px] flex-col gap-4 ${SIDE_BY_SIDE}`}
      >
        <div
          className="w-full max-w-[800px] min-[1168px]:w-[800px] min-[1168px]:max-w-none min-[1168px]:shrink-0"
          style={{
            viewTransitionName: jumpPivot ? undefined : `month-${month}`,
          }}
        >
          <MonthCard
            month={detail.month}
            year={year}
            weekStart={weekStart}
            size="lg"
            spacious
            onDayClick={props.onDayClick}
            pivotDay={props.pivotDay}
            jumpDay={jumpPivot}
            events={events}
            onEventSelect={openEdit}
          />
        </div>
        {countdowns && (
          <div className="w-full max-w-[800px] min-[713px]:hidden">
            <CountdownChips countdowns={countdowns} block />
          </div>
        )}
        <MonthSummaryPanel detail={detail} />
      </div>
    </>
  );
}
