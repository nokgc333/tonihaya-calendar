"use client";

import { getCountdowns, type Countdown } from "@/domain/countdown";
import type { WeekStart } from "@/domain/calendar";
import { useEffect, useRef } from "react";
import type { ZoomState } from "@/domain/view";
import { useZoomState } from "@/hooks/useZoomState";
import { AnnouncerProvider, useAnnouncer } from "@/hooks/useAnnouncer";
import { describeZoom } from "@/components/describeZoom";
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

function useAnnounceZoom(zoom: ZoomState, isReady: boolean): void {
  const announce = useAnnouncer();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!isReady) return;
    const text = describeZoom(zoom);
    if (previous.current !== null && previous.current !== text) announce(text);
    previous.current = text;
  }, [zoom, isReady, announce]);
}

export function CalendarApp() {
  return (
    <AnnouncerProvider>
      <EventProvider>
        <EventEditorProvider>
          <CalendarAppInner />
        </EventEditorProvider>
      </EventProvider>
    </AnnouncerProvider>
  );
}

function CalendarAppInner() {
  const { zoom, today, navigate } = useZoomState();
  useAnnounceZoom(zoom, today !== null);
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
