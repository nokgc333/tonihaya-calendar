"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear, resolveJumpTarget, type JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { useZoomState } from "@/hooks/useZoomState";
import { EventProvider } from "@/hooks/useEvents";
import { EventEditorProvider } from "@/hooks/useEventEditor";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody, type OverviewLayout } from "@/components/OverviewBody";
import { MonthDetail } from "@/components/MonthDetail";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";

const LAYOUT_STORAGE_KEY = "tonihaya.overviewLayout";
const WEEKSTART_STORAGE_KEY = "tonihaya.weekStart";

const LEVEL_ORDER: Record<JumpLevel, number> = {
  overview: 0,
  month: 1,
  week: 2,
  day: 3,
};

export function CalendarApp() {
  return (
    <EventProvider>
      <EventEditorProvider>
        <CalendarAppInner />
      </EventEditorProvider>
    </EventProvider>
  );
}

function CalendarAppInner() {
  const { zoom, today, navigate } = useZoomState();
  const countdowns: Countdown | null = today
    ? getCountdowns(today.year, today.month, today.day)
    : null;

  const [overviewLayout, setOverviewLayout] = useState<OverviewLayout>("3x4");
  useEffect(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved === "3x4" || saved === "4x3") setOverviewLayout(saved);
  }, []);
  const changeOverviewLayout = (next: OverviewLayout): void => {
    setOverviewLayout(next);
    localStorage.setItem(LAYOUT_STORAGE_KEY, next);
  };

  const [weekStart, setWeekStart] = useState<WeekStart>("sun");
  useEffect(() => {
    const saved = localStorage.getItem(WEEKSTART_STORAGE_KEY);
    if (saved === "sun" || saved === "mon") setWeekStart(saved);
  }, []);
  const changeWeekStart = (next: WeekStart): void => {
    setWeekStart(next);
    localStorage.setItem(WEEKSTART_STORAGE_KEY, next);
  };

  const [pivotDay, setPivotDay] = useState<CivilDate | null>(null);
  const [jumpPivot, setJumpPivot] = useState<CivilDate | null>(null);
  const justJumpedRef = useRef(false);
  useEffect(() => {
    if (justJumpedRef.current) {
      justJumpedRef.current = false;
      return;
    }
    setJumpPivot(null);
  }, [zoom.level, zoom.year, zoom.month, zoom.day]);
  const [weekOrigin, setWeekOrigin] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const openDayWeek = (y: number, m: number, d: number): void => {
    const day: CivilDate = { year: clampYear(y), month: m, day: d };
    const origin =
      zoom.level === "month" && zoom.month !== undefined
        ? { year: zoom.year, month: zoom.month }
        : { year: day.year, month: day.month };
    flushSync(() => {
      setPivotDay(day);
      setWeekOrigin(origin);
      setJumpPivot(null);
    });
    navigate(
      { level: "week", year: day.year, month: day.month, day: day.day },
      "push",
    );
  };
  const clearPivotThen = (run: () => void): void => {
    flushSync(() => {
      setPivotDay(null);
      setJumpPivot(null);
    });
    run();
  };

  const [dayPivot, setDayPivot] = useState<CivilDate | null>(null);
  useEffect(() => {
    if (zoom.level !== "week" && zoom.level !== "day") setDayPivot(null);
  }, [zoom.level]);
  const openDay = (y: number, m: number, d: number): void => {
    const target: CivilDate = { year: clampYear(y), month: m, day: d };
    flushSync(() => {
      setDayPivot(target);
      setJumpPivot(null);
    });
    navigate(
      { level: "day", year: target.year, month: target.month, day: target.day },
      "push",
    );
  };

  const jumpTo = (level: JumpLevel): void => {
    const target = resolveJumpTarget(level, zoom, today);
    const dist = Math.abs(LEVEL_ORDER[target.level] - LEVEL_ORDER[zoom.level]);
    const a = resolveJumpTarget("day", zoom, today);
    const anchorDay: CivilDate = { year: a.year, month: a.month!, day: a.day! };
    const levels = new Set<JumpLevel>([zoom.level, target.level]);

    flushSync(() => {
      if (dist >= 2) {
        setPivotDay(null);
        setDayPivot(null);
        setJumpPivot(anchorDay);
        justJumpedRef.current = true;
      } else if (levels.has("week") && levels.has("day")) {
        setPivotDay(null);
        setDayPivot(anchorDay);
        setJumpPivot(null);
      } else if (levels.has("month") && levels.has("week")) {
        setDayPivot(null);
        setPivotDay(anchorDay);
        setJumpPivot(null);
      } else {
        setPivotDay(null);
        setDayPivot(null);
        setJumpPivot(null);
      }
    });
    navigate(target, "push");
  };

  if (
    zoom.level === "day" &&
    zoom.month !== undefined &&
    zoom.day !== undefined
  ) {
    return (
      <main className="mx-auto flex h-dvh min-w-[375px] max-w-[1600px] flex-col px-4 py-5">
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <TodayHeader today={today} countdowns={countdowns} />
          <DayView
            year={zoom.year}
            month={zoom.month}
            day={zoom.day}
            today={today}
            onBack={() => {
              flushSync(() => setJumpPivot(null));
              navigate(
                {
                  level: "week",
                  year: zoom.year,
                  month: zoom.month!,
                  day: zoom.day!,
                },
                "push",
              );
            }}
            onDayChange={(y, m, dd) => {
              setJumpPivot(null);
              setDayPivot({ year: clampYear(y), month: m, day: dd });
              navigate(
                { level: "day", year: clampYear(y), month: m, day: dd },
                "replace",
              );
            }}
            onJump={jumpTo}
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
            jumpPivot={jumpPivot}
          />
        </div>
      </main>
    );
  }

  if (
    zoom.level === "week" &&
    zoom.month !== undefined &&
    zoom.day !== undefined
  ) {
    return (
      <main className="mx-auto flex h-dvh min-w-[375px] max-w-[1600px] flex-col px-4 py-5">
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <TodayHeader today={today} countdowns={countdowns} />
          <WeekView
            year={zoom.year}
            month={zoom.month}
            day={zoom.day}
            today={today}
            onBack={() => {
              flushSync(() => {
                setDayPivot(null);
                setJumpPivot(null);
              });
              const o = weekOrigin ?? { year: zoom.year, month: zoom.month! };
              navigate(
                { level: "month", year: o.year, month: o.month },
                "push",
              );
            }}
            onWeekChange={(y, m, d) => {
              flushSync(() => {
                setDayPivot(null);
                setJumpPivot(null);
                setPivotDay(null);
              });
              navigate(
                { level: "week", year: clampYear(y), month: m, day: d },
                "replace",
              );
            }}
            onDayOpen={openDay}
            dayPivot={dayPivot}
            pivotDay={pivotDay}
            onJump={jumpTo}
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
            jumpPivot={jumpPivot}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-w-[375px] max-w-[1600px] px-4 py-5">
      {zoom.level === "overview" || zoom.month === undefined ? (
        <div className="mx-auto w-full max-w-[1256px] min-[1600px]:max-w-[1600px]">
          <TodayHeader today={today} countdowns={countdowns} />
          <OverviewBody
            year={zoom.year}
            today={today}
            layout={overviewLayout}
            onYearChange={(y) => {
              flushSync(() => setJumpPivot(null));
              navigate({ level: "overview", year: clampYear(y) }, "replace");
            }}
            onMonthClick={(m) => {
              flushSync(() => setJumpPivot(null));
              navigate({ level: "month", year: zoom.year, month: m }, "push");
            }}
            onLayoutChange={changeOverviewLayout}
            onJump={jumpTo}
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
            jumpPivot={jumpPivot}
          />
        </div>
      ) : (
        <div className="w-full">
          <TodayHeader today={today} countdowns={countdowns} />
          <MonthDetail
            year={zoom.year}
            month={zoom.month}
            today={today}
            countdowns={countdowns}
            onBack={() =>
              clearPivotThen(() =>
                navigate({ level: "overview", year: zoom.year }, "push"),
              )
            }
            onMonthChange={(y, m) =>
              clearPivotThen(() =>
                navigate(
                  { level: "month", year: clampYear(y), month: m },
                  "replace",
                ),
              )
            }
            onDayClick={openDayWeek}
            pivotDay={pivotDay}
            onJump={jumpTo}
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
            jumpPivot={jumpPivot}
          />
        </div>
      )}
    </main>
  );
}
