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
        // L0もヘッダー・ナビ・カード群を4列ぶん(1256px)の最大幅ラッパーに入れ左右余白を統一。
        <div className="mx-auto w-full max-w-[1256px]">
          <TodayHeader today={today} countdowns={countdowns} />
          <OverviewBody
            year={zoom.year}
            today={today}
            onYearChange={(y) => navigate({ level: "overview", year: clampYear(y) }, "replace")}
            onMonthClick={(m) => navigate({ level: "month", year: zoom.year, month: m }, "push")}
          />
        </div>
      ) : (
        // L1もL0と同じ最大幅(1256px)ラッパーに入れ、ヘッダー・ナビ・本体の左右余白をL0と統一する。
        <div className="mx-auto w-full max-w-[1256px]">
          <TodayHeader today={today} countdowns={countdowns} />
          <MonthDetail
            year={zoom.year}
            month={zoom.month}
            today={today}
            countdowns={countdowns}
            onBack={() => navigate({ level: "overview", year: zoom.year }, "push")}
            onMonthChange={(y, m) =>
              navigate({ level: "month", year: clampYear(y), month: m }, "replace")
            }
          />
        </div>
      )}
    </main>
  );
}
