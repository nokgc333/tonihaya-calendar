"use client";

import { flushSync } from "react-dom";
import {
  clampYear,
  resolveJumpTarget,
  type JumpLevel,
  type ZoomState,
} from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import { planJump } from "@/components/calendar/calendarJump";
import { useCalendarPivots } from "@/hooks/useCalendarPivots";

type Navigate = (next: ZoomState, mode: "push" | "replace" | "none") => void;
type Pivots = ReturnType<typeof useCalendarPivots>;

function clampedDay(y: number, m: number, d: number): CivilDate {
  return { year: clampYear(y), month: m, day: d };
}

function jumpHandler(
  zoom: ZoomState,
  today: CivilDate | null,
  navigate: Navigate,
  p: Pivots,
) {
  return (level: JumpLevel): void => {
    const target = resolveJumpTarget(level, zoom, today);
    const a = resolveJumpTarget("day", zoom, today);
    const anchor: CivilDate = { year: a.year, month: a.month!, day: a.day! };
    const plan = planJump(zoom.level, target.level, anchor);
    flushSync(() => {
      p.setPivotDay(plan.pivotDay);
      p.setDayPivot(plan.dayPivot);
      p.setJumpPivot(plan.jumpPivot);
      if (plan.markJumped) p.justJumpedRef.current = true;
    });
    navigate(target, "push");
  };
}

function dayHandlers(zoom: ZoomState, navigate: Navigate, p: Pivots) {
  return {
    onBack: (): void => {
      flushSync(() => p.setJumpPivot(null));
      navigate(
        { level: "week", year: zoom.year, month: zoom.month!, day: zoom.day! },
        "push",
      );
    },
    onDayChange: (y: number, m: number, d: number): void => {
      p.setJumpPivot(null);
      p.setDayPivot(clampedDay(y, m, d));
      navigate({ level: "day", ...clampedDay(y, m, d) }, "replace");
    },
  };
}

function weekHandlers(zoom: ZoomState, navigate: Navigate, p: Pivots) {
  return {
    onBack: (): void => {
      flushSync(() => {
        p.setDayPivot(null);
        p.setJumpPivot(null);
      });
      const o = p.weekOrigin ?? { year: zoom.year, month: zoom.month! };
      navigate({ level: "month", year: o.year, month: o.month }, "push");
    },
    onWeekChange: (y: number, m: number, d: number): void => {
      flushSync(() => {
        p.setDayPivot(null);
        p.setJumpPivot(null);
        p.setPivotDay(null);
      });
      navigate({ level: "week", ...clampedDay(y, m, d) }, "replace");
    },
    onDayOpen: (y: number, m: number, d: number): void => {
      const target = clampedDay(y, m, d);
      flushSync(() => {
        p.setDayPivot(target);
        p.setJumpPivot(null);
      });
      navigate({ level: "day", ...target }, "push");
    },
  };
}

function overviewHandlers(zoom: ZoomState, navigate: Navigate, p: Pivots) {
  return {
    onYearChange: (y: number): void => {
      flushSync(() => p.setJumpPivot(null));
      navigate({ level: "overview", year: clampYear(y) }, "replace");
    },
    onMonthClick: (m: number): void => {
      flushSync(() => p.setJumpPivot(null));
      navigate({ level: "month", year: zoom.year, month: m }, "push");
    },
  };
}

function monthHandlers(zoom: ZoomState, navigate: Navigate, p: Pivots) {
  const clearPivotThen = (run: () => void): void => {
    flushSync(() => {
      p.setPivotDay(null);
      p.setJumpPivot(null);
    });
    run();
  };
  return {
    onBack: (): void =>
      clearPivotThen(() =>
        navigate({ level: "overview", year: zoom.year }, "push"),
      ),
    onMonthChange: (y: number, m: number): void =>
      clearPivotThen(() =>
        navigate({ level: "month", year: clampYear(y), month: m }, "replace"),
      ),
    onDayClick: (y: number, m: number, d: number): void => {
      const day = clampedDay(y, m, d);
      const origin =
        zoom.level === "month" && zoom.month !== undefined
          ? { year: zoom.year, month: zoom.month }
          : { year: day.year, month: day.month };
      flushSync(() => {
        p.setPivotDay(day);
        p.setWeekOrigin(origin);
        p.setJumpPivot(null);
      });
      navigate({ level: "week", ...day }, "push");
    },
  };
}

export function createCalendarNavigation(
  zoom: ZoomState,
  today: CivilDate | null,
  navigate: Navigate,
  pivots: Pivots,
) {
  return {
    onJump: jumpHandler(zoom, today, navigate, pivots),
    day: dayHandlers(zoom, navigate, pivots),
    week: weekHandlers(zoom, navigate, pivots),
    overview: overviewHandlers(zoom, navigate, pivots),
    month: monthHandlers(zoom, navigate, pivots),
  };
}
