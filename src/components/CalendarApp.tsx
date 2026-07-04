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

  return (
    // min-w で375px以下はレイアウトを固定（それ未満は横スクロールで切り捨て）。
    <main className="mx-auto min-w-[375px] max-w-[1400px] px-4 py-5">
      {zoom.level === "overview" || zoom.month === undefined ? (
        <>
          <TodayHeader today={today} countdowns={countdowns} />
          <OverviewBody
            year={zoom.year}
            today={today}
            onYearChange={(y) => navigate({ level: "overview", year: clampYear(y) }, "replace")}
            onMonthClick={(m) => navigate({ level: "month", year: zoom.year, month: m }, "push")}
          />
        </>
      ) : (
        // L1はヘッダー・ナビ・本体を同じ最大幅ラッパーに入れ、左右の余白を統一する。
        // 横並び(≥1168px)では1136px、縦積みでは800pxに揃える。
        <div className="mx-auto w-full max-w-[800px] min-[1168px]:max-w-[1136px]">
          <TodayHeader today={today} countdowns={countdowns} />
          <MonthDetail
            year={zoom.year}
            month={zoom.month}
            today={today}
            countdowns={countdowns}
            onBack={() => navigate({ level: "overview", year: zoom.year }, "push")}
            onMonthChange={(m) => navigate({ level: "month", year: zoom.year, month: m }, "replace")}
          />
        </div>
      )}
    </main>
  );
}
