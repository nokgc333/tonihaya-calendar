"use client";

import { useEffect, useRef } from "react";
import { buildDayView, minutesToOffset, type JumpLevel } from "@/domain/view";
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

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const GRID_COLS = "3.5rem 1fr";
const SCROLL_LEAD_HOURS = 2;

export function DayView({
  year,
  month,
  day,
  today,
  onBack,
  onDayChange,
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
  readonly onDayChange: (year: number, month: number, day: number) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}) {
  const { day: d } = buildDayView(year, month, day, today);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { events } = useEvents();
  const { openEdit } = useEventEditor();
  const allDayEvents = eventsForDay(events, { year, month, day }).filter(
    (e) => e.allDay,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

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
    ? minutesToOffset(
        new Date().getHours() * 60 + new Date().getMinutes(),
        HOUR_HEIGHT,
      )
    : 0;

  return (
    <>
      <nav className="mb-5 flex min-h-10 shrink-0 flex-wrap items-center gap-2">
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
          <span className="min-w-[13rem] text-center text-xl font-bold tabular-nums">
            {year}年 {month}月{day}日 {WEEKDAY_JA[d.weekday]}曜日
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
        <div className="ml-auto flex items-center gap-3">
          <AddEventButton date={{ year, month, day }} />
          <LevelSwitcher current="day" onJump={onJump} />
          <SettingsMenu
            weekStart={weekStart}
            onWeekStartChange={onWeekStartChange}
          />
        </div>
      </nav>

      <div
        className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col rounded-md border"
        style={{
          borderColor: "var(--border)",
          viewTransitionName: jumpPivot ? "jump-zoom" : undefined,
        }}
      >
        <div
          className="sticky top-0 z-10 grid min-h-[54.5px] shrink-0 items-center py-1.5"
          style={{
            gridTemplateColumns: GRID_COLS,
            background: "var(--surface)",
            viewTransitionName: jumpPivot ? undefined : "hour-zoom",
          }}
        >
          <div />
          <div
            className="text-center text-lg font-bold tabular-nums"
            style={{ color: dayTextColor(d) }}
          >
            {year}年{month}月{day}日（{WEEKDAY_JA[d.weekday]}）
          </div>
        </div>

        <div
          className="grid shrink-0 border-y"
          style={{
            gridTemplateColumns: GRID_COLS,
            borderColor: "var(--border-strong)",
          }}
        >
          <div
            className="flex items-center justify-end p-1 text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            終日
          </div>
          <div
            className="min-h-[33px] space-y-0.5 border-l p-0.5 text-[10px]"
            style={{ borderColor: "var(--border)", background: dayBgColor(d) }}
          >
            {d.holidayName ? (
              <div
                className="text-center"
                style={{ color: "var(--accent-red)" }}
              >
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
                  style={{
                    background: c.bg,
                    color: c.fg,
                    border: `1px solid ${c.border}`,
                  }}
                  title={e.title}
                >
                  {e.title}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto">
          <div
            className="relative grid"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div
                  className="border-t pr-1 text-right text-[10px]"
                  style={{
                    height: HOUR_HEIGHT,
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  {h}:00
                </div>
                <div
                  className="border-t border-l"
                  style={{
                    height: HOUR_HEIGHT,
                    borderColor: "var(--border)",
                    background: dayBgColor(d),
                  }}
                />
              </div>
            ))}
            <DayTimedEvents
              date={{ year, month, day }}
              hourHeight={HOUR_HEIGHT}
              dayLeft="3.5rem"
              dayWidth="(100% - 3.5rem)"
              onSelect={openEdit}
            />
            {d.isToday && (
              <div
                className="pointer-events-none absolute z-[6]"
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
    </>
  );
}
