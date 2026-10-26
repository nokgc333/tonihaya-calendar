"use client";

import { getCountdowns, type Countdown } from "@/domain/countdown";
import type { WeekStart } from "@/domain/calendar";
import { useZoomState } from "@/hooks/useZoomState";
import { useCalendarPivots } from "@/hooks/useCalendarPivots";
import { createCalendarNavigation } from "@/hooks/calendarNavigation";
import { EventProvider } from "@/hooks/useEvents";
import { EventEditorProvider } from "@/hooks/useEventEditor";
import type { OverviewLayout } from "@/components/OverviewBody";
import { usePersistedChoice } from "@/components/usePersistedChoice";
import {
  DayScreen,
  MonthScreen,
  OverviewScreen,
  WeekScreen,
  type ScreenShared,
} from "@/components/CalendarScreens";

const LAYOUT_STORAGE_KEY = "tonihaya.overviewLayout";
const WEEKSTART_STORAGE_KEY = "tonihaya.weekStart";
const LAYOUTS: readonly OverviewLayout[] = ["3x4", "4x3"];
const WEEK_STARTS: readonly WeekStart[] = ["sun", "mon"];

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
  const [overviewLayout, changeOverviewLayout] = usePersistedChoice(
    LAYOUT_STORAGE_KEY,
    "3x4",
    LAYOUTS,
  );
  const [weekStart, changeWeekStart] = usePersistedChoice(
    WEEKSTART_STORAGE_KEY,
    "sun",
    WEEK_STARTS,
  );
  const pivots = useCalendarPivots(zoom);
  const nav = createCalendarNavigation(zoom, today, navigate, pivots);

  const shared: ScreenShared = {
    year: zoom.year,
    today,
    countdowns,
    weekStart,
    onWeekStartChange: changeWeekStart,
    jumpPivot: pivots.jumpPivot,
    onJump: nav.onJump,
  };

  if (
    zoom.level === "day" &&
    zoom.month !== undefined &&
    zoom.day !== undefined
  ) {
    return (
      <DayScreen
        shared={shared}
        month={zoom.month}
        day={zoom.day}
        nav={nav.day}
      />
    );
  }
  if (
    zoom.level === "week" &&
    zoom.month !== undefined &&
    zoom.day !== undefined
  ) {
    return (
      <WeekScreen
        shared={shared}
        month={zoom.month}
        day={zoom.day}
        dayPivot={pivots.dayPivot}
        pivotDay={pivots.pivotDay}
        nav={nav.week}
      />
    );
  }
  if (zoom.level === "overview" || zoom.month === undefined) {
    return (
      <OverviewScreen
        shared={shared}
        layout={overviewLayout}
        onLayoutChange={changeOverviewLayout}
        nav={nav.overview}
      />
    );
  }
  return (
    <MonthScreen
      shared={shared}
      month={zoom.month}
      pivotDay={pivots.pivotDay}
      nav={nav.month}
    />
  );
}
