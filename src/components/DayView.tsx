"use client";

import { useEffect, useRef } from "react";
import { buildDayView, minutesToOffset, type WeekDay } from "@/domain/view";
import { fromEpochDay, toEpochDay } from "@/domain/shared/date";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const HOUR_HEIGHT = 48; // 1時間あたりの高さ(px)
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;
const GRID_COLS = "3.5rem 1fr";
const SCROLL_LEAD_HOURS = 2;

function dayColor(d: WeekDay): string {
  if (d.isSunday || d.isHoliday) return "var(--accent-red)";
  if (d.isSaturday) return "var(--accent-sat)";
  return "var(--text)";
}
function dayBg(d: WeekDay): string {
  if (d.isSunday || d.isHoliday) return "var(--sun-bg)";
  if (d.isSaturday) return "var(--sat-bg)";
  return "var(--surface)";
}

export function DayView({
  year,
  month,
  day,
  today,
  onBack,
  onDayChange,
}: {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly today: CivilDate | null;
  readonly onBack: () => void;
  readonly onDayChange: (year: number, month: number, day: number) => void;
}) {
  const { day: d } = buildDayView(year, month, day, today);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  // 今日を開いているときのみ現在時刻付近へ自動スクロール
  useEffect(() => {
    if (!bodyRef.current || !d.isToday) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    bodyRef.current.scrollTop = Math.max(
      0,
      minutesToOffset(minutes, HOUR_HEIGHT) - HOUR_HEIGHT * SCROLL_LEAD_HOURS,
    );
  }, [d.isToday, year, month, day]);

  const shiftDay = (delta: number): void => {
    const next = fromEpochDay(toEpochDay(year, month, day) + delta);
    onDayChange(next.year, next.month, next.day);
  };

  const nowOffset = d.isToday
    ? minutesToOffset(new Date().getHours() * 60 + new Date().getMinutes(), HOUR_HEIGHT)
    : 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <nav className="mb-5 flex min-h-10 shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          aria-label="週に戻る（Escでも戻れます）"
        >
          ‹ 戻る
        </button>
        <div className="ml-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="前の日"
          >
            ‹
          </button>
          <span className="min-w-[12rem] text-center text-base font-bold tabular-nums">
            {year}年{month}月{day}日（{WEEKDAY_JA[d.weekday]}）
          </span>
          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="次の日"
          >
            ›
          </button>
        </div>
      </nav>

      {/* 時間グリッドの外枠（L2の日カラムからのモーフ着地点） */}
      <div
        className="flex min-h-0 flex-1 flex-col rounded-md border"
        style={{ borderColor: "var(--border)", viewTransitionName: "hour-zoom" }}
      >
        {/* 大きな日付ヘッダー（sticky）。終日行・時間グリッドと同じGRID_COLSのグリッドにし、
            第1セル(時間軸3.5rem)を空け、日付は第2セル(日カラム)内で中央寄せ。これにより
            終日行/時間列と中央軸が揃う。祝日名は終日行に出るのでここには表示しない。
            高さ48.5px・直下pb-1.5でL2ヘッダー行とボックス寸法を統一する。 */}
        <div
          className="sticky top-0 z-10 grid min-h-[48.5px] shrink-0 items-center pb-1.5"
          style={{ gridTemplateColumns: GRID_COLS, background: "var(--surface)" }}
        >
          <div />
          <div className="text-center text-lg font-bold tabular-nums" style={{ color: dayColor(d) }}>
            {year}年{month}月{day}日（{WEEKDAY_JA[d.weekday]}）
          </div>
        </div>

        {/* 終日行 */}
        <div
          className="grid shrink-0 border-y"
          style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border-strong)" }}
        >
          <div className="p-1 text-right text-[10px]" style={{ color: "var(--text-muted)" }}>
            終日
          </div>
          <div
            className="min-h-[1.5rem] border-l p-0.5 text-center text-[10px]"
            style={{ borderColor: "var(--border)", background: dayBg(d), color: "var(--accent-red)" }}
          >
            {d.holidayName ?? ""}
          </div>
        </div>

        {/* 時間グリッド本体（縦スクロール） */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative grid" style={{ gridTemplateColumns: GRID_COLS }}>
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div
                  className="border-t pr-1 text-right text-[10px]"
                  style={{ height: HOUR_HEIGHT, borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  {h}:00
                </div>
                <div
                  className="border-t border-l"
                  style={{ height: HOUR_HEIGHT, borderColor: "var(--border)", background: dayBg(d) }}
                />
              </div>
            ))}
            {/* 今ライン（今日のみ） */}
            {d.isToday && (
              <div
                className="pointer-events-none absolute"
                style={{
                  top: nowOffset,
                  left: "3.5rem",
                  right: 0,
                  borderTop: "2px solid var(--accent-red)",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
