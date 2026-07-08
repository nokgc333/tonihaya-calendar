"use client";

import { useEffect, useRef, useState } from "react";
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

const LEVEL_ORDER: Record<JumpLevel, number> = { overview: 0, month: 1, week: 2, day: 3 };

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
  // 多段ジャンプ（2レベル以上）のズーム起点。全ビューが「その日」の要素に jump-zoom を張る。
  const [jumpPivot, setJumpPivot] = useState<CivilDate | null>(null);
  // jumpPivot はジャンプ遷移の1レンダーだけ保持したい。ジャンプ直後は justJumped で残し、
  // 次の任意の遷移（ドリル/前後/戻る=popstate含む）で必ず掃除する。個別ハンドラの掃除に加え、
  // popstate はハンドラを通らないためこの監視が最終保険になる。
  const justJumpedRef = useRef(false);
  useEffect(() => {
    if (justJumpedRef.current) {
      justJumpedRef.current = false;
      return;
    }
    setJumpPivot(null);
  }, [zoom.level, zoom.year, zoom.month, zoom.day]);
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
      setJumpPivot(null);
    });
    navigate({ level: "week", year: day.year, month: day.month, day: day.day }, "push");
  };
  // L1から週以外へ移動する際は、遷移キャプチャ前にピボットを消して day-zoom セルの
  // 取り残し（対応先なしのチラつき）を防ぐ。
  const clearPivotThen = (run: () => void): void => {
    flushSync(() => {
      setPivotDay(null);
      setJumpPivot(null);
    });
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
    flushSync(() => {
      setDayPivot(target);
      setJumpPivot(null);
    });
    navigate({ level: "day", year: target.year, month: target.month, day: target.day }, "push");
  };

  // 年/月/週/日セグメントからのジャンプ。距離で分岐し、隣接は既存モーフを流用する。
  // 隣接 L1↔L2=day-zoom(pivotDay) / L2↔L3=hour-zoom(dayPivot) / L0↔L1=month-N(無条件)。
  // 多段は Task2 で jump-zoom を張る（現時点ではクロスフェード）。
  const jumpTo = (level: JumpLevel): void => {
    const target = resolveJumpTarget(level, zoom, today);
    const dist = Math.abs(LEVEL_ORDER[target.level] - LEVEL_ORDER[zoom.level]);
    const a = resolveJumpTarget("day", zoom, today);
    const anchorDay: CivilDate = { year: a.year, month: a.month!, day: a.day! };
    const levels = new Set<JumpLevel>([zoom.level, target.level]);

    flushSync(() => {
      if (dist >= 2) {
        // 多段: 日アンカー jump-zoom。他ピボットは掃除。ジャンプ直後1レンダーだけ保持する印。
        setPivotDay(null);
        setDayPivot(null);
        setJumpPivot(anchorDay);
        justJumpedRef.current = true;
      } else if (levels.has("week") && levels.has("day")) {
        // 隣接 L2↔L3: hour-zoom
        setPivotDay(null);
        setDayPivot(anchorDay);
        setJumpPivot(null);
      } else if (levels.has("month") && levels.has("week")) {
        // 隣接 L1↔L2: day-zoom（進む・戻る両方向）。着地側の穴は MonthCard 側で
        // 「本物の週は root に残し、複製オーバーレイに day-zoom を張る」ことで防ぐ。
        setDayPivot(null);
        setPivotDay(anchorDay);
        setJumpPivot(null);
      } else {
        // 隣接 L0↔L1: month-N（無条件）
        setPivotDay(null);
        setDayPivot(null);
        setJumpPivot(null);
      }
    });
    navigate(target, "push");
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
              onBack={() => {
                flushSync(() => setJumpPivot(null));
                navigate(
                  { level: "week", year: zoom.year, month: zoom.month!, day: zoom.day! },
                  "push",
                );
              }}
              onDayChange={(y, m, dd) => {
                // L3内で日送りしたら、戻り時のモーフが現在表示日の列に着地するよう
                // ピボットも追従させる（古い日の列へ hour-zoom が残るのを防ぐ）。
                setJumpPivot(null);
                setDayPivot({ year: clampYear(y), month: m, day: dd });
                navigate({ level: "day", year: clampYear(y), month: m, day: dd }, "replace");
              }}
              onJump={jumpTo}
              weekStart={weekStart}
              onWeekStartChange={changeWeekStart}
              jumpPivot={jumpPivot}
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
                flushSync(() => {
                  setDayPivot(null);
                  setJumpPivot(null);
                });
                // 実日付の月ではなく、週を開いた文脈月へ戻す（グレーセル経由でもズレない）。
                const o = weekOrigin ?? { year: zoom.year, month: zoom.month! };
                navigate({ level: "month", year: o.year, month: o.month }, "push");
              }}
              onWeekChange={(y, m, d) => {
                flushSync(() => {
                  setDayPivot(null);
                  setJumpPivot(null);
                });
                navigate({ level: "week", year: clampYear(y), month: m, day: d }, "replace");
              }}
              onDayOpen={openDay}
              dayPivot={dayPivot}
              pivotDay={pivotDay}
              onJump={jumpTo}
              weekStart={weekStart}
              onWeekStartChange={changeWeekStart}
              jumpPivot={jumpPivot}
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
            onYearChange={(y) => {
              flushSync(() => setJumpPivot(null));
              navigate({ level: "overview", year: clampYear(y) }, "replace");
            }}
            onMonthClick={(m) => {
              flushSync(() => setJumpPivot(null));
              navigate({ level: "month", year: zoom.year, month: m }, "push");
            }}
            onLayoutChange={changeOverviewLayout}
            onJump={jumpTo}
            weekStart={weekStart}
            onWeekStartChange={changeWeekStart}
            jumpPivot={jumpPivot}
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
            jumpPivot={jumpPivot}
          />
        </div>
      )}
    </main>
  );
}
