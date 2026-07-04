"use client";

import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear } from "@/domain/view";
import { useZoomState } from "@/hooks/useZoomState";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody } from "@/components/OverviewBody";
import { MonthDetail } from "@/components/MonthDetail";

export function CalendarApp() {
  const { zoom, today, navigate } = useZoomState();
  const countdowns: Countdown | null = today
    ? getCountdowns(today.year, today.month, today.day)
    : null;

  // 単月(L1)はビューポート高さにフィットさせスクロールを避ける。俯瞰(L0)は自然フロー。
  const isMonthView = zoom.level === "month" && zoom.month !== undefined;

  return (
    <main
      className={`mx-auto max-w-[1400px] px-4 py-5 ${isMonthView ? "flex h-dvh flex-col" : ""}`}
    >
      <TodayHeader today={today} countdowns={countdowns} />
      {zoom.level === "overview" || zoom.month === undefined ? (
        <OverviewBody
          year={zoom.year}
          today={today}
          onYearChange={(y) => navigate({ level: "overview", year: clampYear(y) }, "replace")}
          onMonthClick={(m) => navigate({ level: "month", year: zoom.year, month: m }, "push")}
        />
      ) : (
        <div className="min-h-0 flex-1">
          <MonthDetail
            year={zoom.year}
            month={zoom.month}
            today={today}
            onBack={() => navigate({ level: "overview", year: zoom.year }, "push")}
            onMonthChange={(m) => navigate({ level: "month", year: zoom.year, month: m }, "replace")}
          />
        </div>
      )}
    </main>
  );
}
