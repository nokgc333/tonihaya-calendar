"use client";

import { Fragment, useEffect, useRef } from "react";
import { buildWeekView, minutesToOffset, type JumpLevel, type WeekDay } from "@/domain/view";
import { fromEpochDay, toEpochDay, type CivilDate } from "@/domain/shared/date";
import type { WeekStart } from "@/domain/calendar";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { dayBgColor, dayTextColor } from "@/components/dayPalette";
import { WEEKDAY_JA } from "@/components/weekdays";
import { DayTimedEvents } from "@/components/DayTimedEvents";
import { AddEventButton } from "@/components/AddEventButton";
import { useEvents } from "@/hooks/useEvents";
import { useEventEditor } from "@/hooks/useEventEditor";
import { eventsForDay } from "@/domain/event";
import { eventColor } from "@/components/eventColors";


const HOUR_HEIGHT = 48; // 1時間あたりの高さ(px)
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const GRID_COLS = "3.5rem repeat(7, minmax(4.5rem, 1fr))";
const SCROLL_LEAD_HOURS = 2;


export function WeekView({
  year,
  month,
  day,
  today,
  onBack,
  onWeekChange,
  onDayOpen,
  dayPivot,
  pivotDay,
  onJump,
  weekStart,
  onWeekStartChange,
  jumpPivot,
}: {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly today: CivilDate | null;
  readonly onBack: () => void;
  readonly onWeekChange: (year: number, month: number, day: number) => void;
  readonly onDayOpen: (year: number, month: number, day: number) => void;
  readonly dayPivot: CivilDate | null;
  readonly pivotDay: CivilDate | null;
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}) {
  const week = buildWeekView(year, month, day, today, { weekStart });
  const bodyRef = useRef<HTMLDivElement>(null);
  const { events } = useEvents();
  const { openEdit } = useEventEditor();
  const todayIndex = week.days.findIndex((d) => d.isToday);
  const isPivot = (d: WeekDay): boolean =>
    dayPivot !== null &&
    dayPivot.year === d.year &&
    dayPivot.month === d.month &&
    dayPivot.day === d.day;
  const isJump = (d: WeekDay): boolean =>
    jumpPivot !== null &&
    jumpPivot.year === d.year &&
    jumpPivot.month === d.month &&
    jumpPivot.day === d.day;
  // L1↔L2 遷移中は、押下日セルを「週ヘッダー行全体」へモーフさせる（day-zoom）。
  // pivotDay は L2↔L3 遷移後も残存し得るため、dayPivot/jumpPivot が null のときに限定する。
  const isDayZoom = pivotDay !== null && dayPivot === null && jumpPivot === null;

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
      <nav className="mb-5 flex min-h-10 shrink-0 flex-wrap items-center gap-2">
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
        <div className="ml-auto flex items-center gap-3">
          <AddEventButton date={{ year, month, day }} />
          <LevelSwitcher current="week" onJump={onJump} />
          <SettingsMenu weekStart={weekStart} onWeekStartChange={onWeekStartChange} />
        </div>
      </nav>

      {/* スクロール横断の外枠。列幅を保つため横スクロール可 */}
      {/* 外枠は共有要素を持たず root クロスフェードで現れる。ズームは日ヘッダー
          （day-zoom/hour-zoom/jump-zoom）が「その日」を狙って担う。 */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-x-auto rounded-md border"
        style={{ borderColor: "var(--border)" }}
      >
        {/* 曜日+日付ヘッダー（sticky）。L0/L1の曜日行に合わせ外枠なし・面色#fbfbfb。 */}
        <div
          className="sticky top-0 z-10 grid shrink-0 pb-1.5"
          style={{
            gridTemplateColumns: GRID_COLS,
            background: "var(--surface)",
            viewTransitionName: isDayZoom ? "day-zoom" : undefined,
          }}
        >
          <div />
          {week.days.map((d) => (
            <button
              key={`h-${d.month}-${d.day}`}
              type="button"
              onClick={() => onDayOpen(d.year, d.month, d.day)}
              className="w-full cursor-pointer p-1 text-center transition-opacity hover:opacity-70"
              style={{
                ...(isPivot(d)
                  ? { viewTransitionName: "hour-zoom" }
                  : isJump(d)
                    ? { viewTransitionName: "jump-zoom" }
                    : {}),
                // 本日は L0/L1 と同じく塗りではなく外枠リングで表す（角丸なし）。
                ...(d.isToday ? { boxShadow: "inset 0 0 0 1.5px var(--today-bg)" } : {}),
              }}
              aria-label={`${d.month}月${d.day}日を開く`}
            >
              <div className="text-[11px]" style={{ color: dayTextColor(d) }}>
                {WEEKDAY_JA[d.weekday]}
              </div>
              <div
                className="text-base font-bold tabular-nums"
                style={{ color: dayTextColor(d) }}
                {...(d.isToday ? { "aria-current": "date" as const } : {})}
              >
                {d.day}
              </div>
            </button>
          ))}
        </div>

        {/* 終日行（祝日名） */}
        <div
          className="grid shrink-0 border-y"
          style={{ gridTemplateColumns: GRID_COLS, borderColor: "var(--border-strong)" }}
        >
          <div className="flex items-center justify-end p-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
            終日
          </div>
          {week.days.map((d) => {
            const allDayEvents = eventsForDay(events, {
              year: d.year,
              month: d.month,
              day: d.day,
            }).filter((e) => e.allDay);
            return (
              <div
                key={`a-${d.month}-${d.day}`}
                className="min-h-[33px] space-y-0.5 border-l p-0.5 text-[10px]"
                style={{ borderColor: "var(--border)", background: dayBgColor(d) }}
              >
                {d.holidayName ? (
                  <div className="text-center" style={{ color: "var(--accent-red)" }}>
                    {d.holidayName}
                  </div>
                ) : null}
                {allDayEvents.map((e) => {
                  const c = eventColor(e.colorKey);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      data-event-id={e.id}
                      onClick={() => openEdit(e.id)}
                      className="block w-full truncate rounded px-1 text-left leading-tight transition-opacity hover:opacity-90"
                      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
                      title={e.title}
                    >
                      {e.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
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
                    style={{ height: HOUR_HEIGHT, borderColor: "var(--border)", background: dayBgColor(d) }}
                  />
                ))}
              </Fragment>
            ))}
            {/* 各日の時間イベント層（今ラインと同じ relative 親の中に絶対配置） */}
            {week.days.map((d, i) => (
              <DayTimedEvents
                key={`ev-${d.month}-${d.day}`}
                date={{ year: d.year, month: d.month, day: d.day }}
                hourHeight={HOUR_HEIGHT}
                dayLeft={`(3.5rem + (100% - 3.5rem) * ${i} / 7)`}
                dayWidth="((100% - 3.5rem) / 7)"
                onSelect={openEdit}
              />
            ))}
            {/* 今ライン（今日の列のみ） */}
            {todayIndex >= 0 && (
              <div
                className="pointer-events-none absolute z-[6]"
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
