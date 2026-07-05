"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear } from "@/domain/view";
import { useZoomState } from "@/hooks/useZoomState";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody, type OverviewLayout } from "@/components/OverviewBody";
import { MonthDetail } from "@/components/MonthDetail";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";

const LAYOUT_STORAGE_KEY = "tonihaya.overviewLayout";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

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

  // L1⇄L2ズームの起点となる「ピボット日」。前進(日クリック)時にflushSyncで確定し、
  // 遷移キャプチャ前にL1へ view-transition-name を反映させる。後退時も同じ日を保持して
  // 週グリッド→日セルへ対称にモーフィングさせる。
  const [pivotDay, setPivotDay] = useState<CivilDate | null>(null);
  // 週を開いたときのL1の文脈月（＝画面に表示していた月）。前月/翌月のグレーセルを
  // 押したときでも「戻る」で実日付の月ではなく文脈月へ戻すために保持する。
  const [weekOrigin, setWeekOrigin] = useState<{ year: number; month: number } | null>(null);
  const openDayWeek = (y: number, m: number, d: number): void => {
    const day: CivilDate = { year: clampYear(y), month: m, day: d };
    const origin =
      zoom.level === "month" && zoom.month !== undefined
        ? { year: zoom.year, month: zoom.month }
        : { year: day.year, month: day.month };
    flushSync(() => {
      setPivotDay(day);
      setWeekOrigin(origin);
    });
    navigate({ level: "week", year: day.year, month: day.month, day: day.day }, "push");
  };
  // L1から週以外へ移動する際は、遷移キャプチャ前にピボットを消して day-zoom セルの
  // 取り残し（対応先なしのチラつき）を防ぐ。
  const clearPivotThen = (run: () => void): void => {
    flushSync(() => setPivotDay(null));
    run();
  };

  if (zoom.level === "day" && zoom.month !== undefined && zoom.day !== undefined) {
    return (
      <main className="mx-auto flex h-dvh min-w-[375px] max-w-[1400px] flex-col px-4 py-5">
        <div className="mx-auto flex min-h-0 w-full max-w-[1256px] flex-1 flex-col">
          <TodayHeader today={today} countdowns={countdowns} />
          <div className="min-h-0 flex-1">
            <DayView
              year={zoom.year}
              month={zoom.month}
              day={zoom.day}
              today={today}
              onBack={() =>
                navigate(
                  { level: "week", year: zoom.year, month: zoom.month!, day: zoom.day! },
                  "push",
                )
              }
              onDayChange={(y, m, dd) =>
                navigate({ level: "day", year: clampYear(y), month: m, day: dd }, "replace")
              }
            />
          </div>
        </div>
      </main>
    );
  }

  if (zoom.level === "week" && zoom.month !== undefined && zoom.day !== undefined) {
    return (
      <main className="mx-auto flex h-dvh min-w-[375px] max-w-[1400px] flex-col px-4 py-5">
        {/* L0/L1と左右余白・最大幅(1256px)を統一する。 */}
        <div className="mx-auto flex min-h-0 w-full max-w-[1256px] flex-1 flex-col">
          <TodayHeader today={today} countdowns={countdowns} />
          <div className="min-h-0 flex-1">
            <WeekView
              year={zoom.year}
              month={zoom.month}
              day={zoom.day}
              today={today}
              onBack={() => {
                // 実日付の月ではなく、週を開いた文脈月へ戻す（グレーセル経由でもズレない）。
                const o = weekOrigin ?? { year: zoom.year, month: zoom.month! };
                navigate({ level: "month", year: o.year, month: o.month }, "push");
              }}
              onWeekChange={(y, m, d) =>
                navigate({ level: "week", year: clampYear(y), month: m, day: d }, "replace")
              }
              onDayOpen={(y, m, d) =>
                navigate({ level: "day", year: clampYear(y), month: m, day: d }, "push")
              }
            />
          </div>
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
            onBack={() =>
              clearPivotThen(() => navigate({ level: "overview", year: zoom.year }, "push"))
            }
            onMonthChange={(y, m) =>
              clearPivotThen(() =>
                navigate({ level: "month", year: clampYear(y), month: m }, "replace"),
              )
            }
            onDayClick={openDayWeek}
            pivotDay={pivotDay}
          />
        </div>
      )}
    </main>
  );
}
