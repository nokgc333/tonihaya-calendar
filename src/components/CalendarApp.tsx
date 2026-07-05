"use client";

import { useEffect, useState } from "react";
import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear } from "@/domain/view";
import { useZoomState } from "@/hooks/useZoomState";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody, type OverviewLayout } from "@/components/OverviewBody";
import { MonthDetail } from "@/components/MonthDetail";
import { WeekView } from "@/components/WeekView";

const LAYOUT_STORAGE_KEY = "tonihaya.overviewLayout";

export function CalendarApp() {
  const { zoom, today, navigate } = useZoomState();
  const countdowns: Countdown | null = today
    ? getCountdowns(today.year, today.month, today.day)
    : null;

  // 俯瞰レイアウト（3行×4列 / 4行×3列）。localStorage に保存し次回以降も維持。
  const [overviewLayout, setOverviewLayout] = useState<OverviewLayout>("3x4");
  useEffect(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved === "3x4" || saved === "4x3") setOverviewLayout(saved);
  }, []);
  const changeOverviewLayout = (next: OverviewLayout): void => {
    setOverviewLayout(next);
    localStorage.setItem(LAYOUT_STORAGE_KEY, next);
  };

  if (zoom.level === "week" && zoom.month !== undefined && zoom.day !== undefined) {
    return (
      <main className="mx-auto flex h-dvh min-w-[375px] max-w-[1256px] flex-col px-4 py-5">
        <TodayHeader today={today} countdowns={countdowns} />
        <div className="min-h-0 flex-1">
          <WeekView
            year={zoom.year}
            month={zoom.month}
            day={zoom.day}
            today={today}
            onBack={() => navigate({ level: "month", year: zoom.year, month: zoom.month! }, "push")}
            onWeekChange={(y, m, d) =>
              navigate({ level: "week", year: clampYear(y), month: m, day: d }, "replace")
            }
          />
        </div>
      </main>
    );
  }

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
            layout={overviewLayout}
            onYearChange={(y) => navigate({ level: "overview", year: clampYear(y) }, "replace")}
            onMonthClick={(m) => navigate({ level: "month", year: zoom.year, month: m }, "push")}
            onLayoutChange={changeOverviewLayout}
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
            onDayClick={(y, m, d) =>
              navigate({ level: "week", year: clampYear(y), month: m, day: d }, "push")
            }
          />
        </div>
      )}
    </main>
  );
}
