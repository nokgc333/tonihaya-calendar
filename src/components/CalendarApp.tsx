"use client";

import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear } from "@/domain/view";
import { useZoomState } from "@/hooks/useZoomState";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody } from "@/components/OverviewBody";

export function CalendarApp() {
  const { zoom, today, navigate } = useZoomState();
  const countdowns: Countdown | null = today
    ? getCountdowns(today.year, today.month, today.day)
    : null;

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5">
      <TodayHeader today={today} countdowns={countdowns} />
      <OverviewBody
        year={zoom.year}
        today={today}
        onYearChange={(y) => navigate({ level: "overview", year: clampYear(y) }, "replace")}
        onMonthClick={(m) => navigate({ level: "month", year: zoom.year, month: m }, "push")}
      />
    </main>
  );
}
