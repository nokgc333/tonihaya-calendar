"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { getCountdowns, type Countdown } from "@/domain/countdown";
import { clampYear, resolveJumpTarget, type JumpLevel } from "@/domain/view";
import type { WeekStart } from "@/domain/calendar";
import { useZoomState } from "@/hooks/useZoomState";
import { TodayHeader } from "@/components/TodayHeader";
import { OverviewBody, type OverviewLayout } from "@/components/OverviewBody";
import { MonthDetail } from "@/components/MonthDetail";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";

const LAYOUT_STORAGE_KEY = "tonihaya.overviewLayout";
const WEEKSTART_STORAGE_KEY = "tonihaya.weekStart";

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

  // 週開始（日/月）。localStorage に保存し次回以降も維持。全ビューに反映する。
  const [weekStart, setWeekStart] = useState<WeekStart>("sun");
  useEffect(() => {
    const saved = localStorage.getItem(WEEKSTART_STORAGE_KEY);
    if (saved === "sun" || saved === "mon") setWeekStart(saved);
  }, []);
  const changeWeekStart = (next: WeekStart): void => {
    setWeekStart(next);
    localStorage.setItem(WEEKSTART_STORAGE_KEY, next);
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

  // L2⇄L3ズームの起点となる「日ピボット」。日クリック時にflushSyncで確定し、
  // 遷移キャプチャ前にL2の当該日ヘッダー列へ hour-zoom を反映させる。
  const [dayPivot, setDayPivot] = useState<CivilDate | null>(null);
  // L2/L3の外に出たら（overview/month）ピボットを掃除し、次のL1⇄L2ズームに
  // 古いdayPivotが残って day-zoom を誤って無効化しないようにする。
  // ブラウザ戻る(popstate)経由でも確実にクリアされるようzoom.levelを監視する。
  useEffect(() => {
    if (zoom.level !== "week" && zoom.level !== "day") setDayPivot(null);
  }, [zoom.level]);
  const openDay = (y: number, m: number, d: number): void => {
    const target: CivilDate = { year: clampYear(y), month: m, day: d };
    flushSync(() => setDayPivot(target));
    navigate({ level: "day", year: target.year, month: target.month, day: target.day }, "push");
  };

  // 年/月/週/日セグメントからの直接ジャンプ。隣接レベル用の共有要素が非隣接
  // ジャンプで取り残されないよう、両ピボットを掃除してから遷移する。
  const jumpTo = (level: JumpLevel): void => {
    flushSync(() => {
      setPivotDay(null);
      setDayPivot(null);
    });
    navigate(resolveJumpTarget(level, zoom, today), "push");
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
              onDayChange={(y, m, dd) => {
                // L3内で日送りしたら、戻り時のモーフが現在表示日の列に着地するよう
                // ピボットも追従させる（古い日の列へ hour-zoom が残るのを防ぐ）。
                setDayPivot({ year: clampYear(y), month: m, day: dd });
                navigate({ level: "day", year: clampYear(y), month: m, day: dd }, "replace");
              }}
              onJump={jumpTo}
              weekStart={weekStart}
              onWeekStartChange={changeWeekStart}
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
                flushSync(() => setDayPivot(null));
                // 実日付の月ではなく、週を開いた文脈月へ戻す（グレーセル経由でもズレない）。
                const o = weekOrigin ?? { year: zoom.year, month: zoom.month! };
                navigate({ level: "month", year: o.year, month: o.month }, "push");
              }}
              onWeekChange={(y, m, d) => {
                flushSync(() => setDayPivot(null));
                navigate({ level: "week", year: clampYear(y), month: m, day: d }, "replace");
              }}
              onDayOpen={openDay}
              dayPivot={dayPivot}
              onJump={jumpTo}
              weekStart={weekStart}
              onWeekStartChange={changeWeekStart}
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
            onJump={jumpTo}
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
            onJump={jumpTo}
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
          />
        </div>
      )}
    </main>
  );
}
