"use client";

import { Fragment, useEffect, useRef } from "react";
import { buildWeekView, minutesToOffset, type JumpLevel, type WeekDay } from "@/domain/view";
import { fromEpochDay, toEpochDay } from "@/domain/shared/date";
import { LevelSwitcher } from "@/components/LevelSwitcher";

interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const HOUR_HEIGHT = 48; // 1時間あたりの高さ(px)
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;
const GRID_COLS = "3.5rem repeat(7, minmax(4.5rem, 1fr))";
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

export function WeekView({
  year,
  month,
  day,
  today,
  onBack,
  onWeekChange,
  onDayOpen,
  dayPivot,
  onJump,
}: {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly today: CivilDate | null;
  readonly onBack: () => void;
  readonly onWeekChange: (year: number, month: number, day: number) => void;
  readonly onDayOpen: (year: number, month: number, day: number) => void;
  readonly dayPivot: { readonly year: number; readonly month: number; readonly day: number } | null;
  readonly onJump: (level: JumpLevel) => void;
}) {
  const week = buildWeekView(year, month, day, today, { weekStart: "sun" });
  const bodyRef = useRef<HTMLDivElement>(null);
  const todayIndex = week.days.findIndex((d) => d.isToday);
  const isPivot = (d: WeekDay): boolean =>
    dayPivot !== null &&
    dayPivot.year === d.year &&
    dayPivot.month === d.month &&
    dayPivot.day === d.day;

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  // 今日が週内なら現在時刻付近へ自動スクロール
  useEffect(() => {
    if (!bodyRef.current || todayIndex < 0) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    bodyRef.current.scrollTop = Math.max(
      0,
      minutesToOffset(minutes, HOUR_HEIGHT) - HOUR_HEIGHT * SCROLL_LEAD_HOURS,
    );
  }, [todayIndex, year, month, day]);

  const shiftWeek = (deltaWeeks: number): void => {
    const next = fromEpochDay(toEpochDay(year, month, day) + deltaWeeks * 7);
    onWeekChange(next.year, next.month, next.day);
  };

  const first = week.days[0];
  const last = week.days[6];
  const nowOffset =
    todayIndex >= 0
      ? minutesToOffset(new Date().getHours() * 60 + new Date().getMinutes(), HOUR_HEIGHT)
      : 0;

  return (
    <div className="flex h-full flex-col">
      <nav className="mb-5 flex min-h-10 shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          aria-label="月に戻る（Escでも戻れます）"
        >
          ‹ 戻る
        </button>
        <div className="ml-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="前の週"
          >
            ‹
          </button>
          <span className="min-w-[13rem] text-center text-xl font-bold tabular-nums">
            {first.year}年{first.month}月{first.day}日 〜 {last.month}月{last.day}日
          </span>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="次の週"
          >
            ›
          </button>
        </div>
        <div className="ml-auto">
          <LevelSwitcher current="week" onJump={onJump} />
        </div>
      </nav>

      {/* スクロール横断の外枠。列幅を保つため横スクロール可 */}
      {/* L2⇄L3遷移中(dayPivot非null)は外枠のday-zoomを外し、対応先を持たない外枠が
          単独スナップショット化してhour-zoomモーフに干渉するのを防ぐ。L1⇄L2遷移時は
          dayPivotがnullなのでday-zoomが有効になる。 */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-md border"
        style={{ borderColor: "var(--border)", viewTransitionName: dayPivot ? "none" : "day-zoom" }}
      >
        {/* 曜日+日付ヘッダー（sticky）。L0/L1の曜日行に合わせ外枠なし・面色#fbfbfb。 */}
        <div
          className="sticky top-0 z-10 grid shrink-0 pb-1.5"
          style={{ gridTemplateColumns: GRID_COLS, background: "var(--surface)" }}
        >
          <div />
          {week.days.map((d) => (
            <button
              key={`h-${d.month}-${d.day}`}
              type="button"
              onClick={() => onDayOpen(d.year, d.month, d.day)}
              className="w-full cursor-pointer p-1 text-center transition-opacity hover:opacity-70"
              style={isPivot(d) ? { viewTransitionName: "hour-zoom" } : undefined}
              aria-label={`${d.month}月${d.day}日を開く`}
            >
              <div className="text-[11px]" style={{ color: dayColor(d) }}>
                {WEEKDAY_JA[d.weekday]}
              </div>
              {d.isToday ? (
                <span
                  className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-base font-bold"
                  style={{ background: "var(--today-bg)", color: "var(--today-fg)" }}
                  aria-current="date"
                >
                  {d.day}
                </span>
              ) : (
                <div className="text-base font-bold tabular-nums" style={{ color: dayColor(d) }}>
                  {d.day}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 終日行（祝日名） */}
        <div
          className="grid shrink-0 border-y"
          style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border-strong)" }}
        >
          <div className="p-1 text-right text-[10px]" style={{ color: "var(--text-muted)" }}>
            終日
          </div>
          {week.days.map((d) => (
            <div
              key={`a-${d.month}-${d.day}`}
              className="min-h-[1.5rem] border-l p-0.5 text-center text-[10px]"
              style={{ borderColor: "var(--border)", background: dayBg(d), color: "var(--accent-red)" }}
            >
              {d.holidayName ?? ""}
            </div>
          ))}
        </div>

        {/* 時間グリッド本体（縦スクロール） */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative grid" style={{ gridTemplateColumns: GRID_COLS }}>
            {HOURS.map((h) => (
              <Fragment key={h}>
                <div
                  className="border-t pr-1 text-right text-[10px]"
                  style={{ height: HOUR_HEIGHT, borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  {h}:00
                </div>
                {week.days.map((d) => (
                  <button
                    key={`c-${h}-${d.month}-${d.day}`}
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={() => onDayOpen(d.year, d.month, d.day)}
                    className="w-full cursor-pointer border-t border-l transition-opacity hover:opacity-80"
                    style={{ height: HOUR_HEIGHT, borderColor: "var(--border)", background: dayBg(d) }}
                  />
                ))}
              </Fragment>
            ))}
            {/* 今ライン（今日の列のみ） */}
            {todayIndex >= 0 && (
              <div
                className="pointer-events-none absolute"
                style={{
                  top: nowOffset,
                  left: `calc(3.5rem + ${todayIndex} * (100% - 3.5rem) / 7)`,
                  width: `calc((100% - 3.5rem) / 7)`,
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
