"use client";

import { useEffect } from "react";
import { buildMonthDetail, type JumpLevel } from "@/domain/view";
import type { CivilDate } from "@/domain/shared/date";
import type { Countdown } from "@/domain/countdown";
import type { WeekStart } from "@/domain/calendar";
import { MonthCard } from "@/components/MonthCard";
import { CountdownChips } from "@/components/CountdownChips";
import { LevelSwitcher } from "@/components/LevelSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { WEEKDAY_JA } from "@/components/weekdays";
import { useEvents } from "@/hooks/useEvents";
import { useEventEditor } from "@/hooks/useEventEditor";
import { AddEventButton } from "@/components/AddEventButton";

const SIDE_BY_SIDE = "min-[1168px]:flex-row min-[1168px]:items-start";

export function MonthDetail({
  year,
  month,
  today,
  countdowns,
  onBack,
  onMonthChange,
  onDayClick,
  onJump,
  pivotDay,
  weekStart,
  onWeekStartChange,
  jumpPivot,
}: {
  readonly year: number;
  readonly month: number;
  readonly today: CivilDate | null;
  readonly countdowns: Countdown | null;
  readonly onBack: () => void;
  readonly onMonthChange: (year: number, month: number) => void;
  readonly onDayClick: (year: number, month: number, day: number) => void;
  readonly onJump: (level: JumpLevel) => void;
  readonly pivotDay?: CivilDate | null;
  readonly weekStart: WeekStart;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly jumpPivot: CivilDate | null;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const detail = buildMonthDetail(year, month, today, { weekStart });
  const { events } = useEvents();
  const { openEdit } = useEventEditor();
  const defaultDate =
    today && today.year === year && today.month === month
      ? today
      : { year, month, day: 1 };

  return (
    <>
      <nav className="mb-5 flex min-h-10 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border px-3 py-1 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          aria-label="俯瞰に戻る（Escでも戻れます）"
        >
          ‹ 戻る
        </button>
        <div className="ml-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              month === 1
                ? onMonthChange(year - 1, 12)
                : onMonthChange(year, month - 1)
            }
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="前の月"
          >
            ‹
          </button>
          <span className="min-w-[8rem] text-center text-xl font-bold tabular-nums">
            {year}年 {month}月
          </span>
          <button
            type="button"
            onClick={() =>
              month === 12
                ? onMonthChange(year + 1, 1)
                : onMonthChange(year, month + 1)
            }
            className="rounded-md border px-2 py-1 text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
            aria-label="次の月"
          >
            ›
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <AddEventButton date={defaultDate} />
          <LevelSwitcher current="month" onJump={onJump} />
          <SettingsMenu
            weekStart={weekStart}
            onWeekStartChange={onWeekStartChange}
          />
        </div>
      </nav>

      <div
        className={`mx-auto flex w-full max-w-[1256px] flex-col gap-4 ${SIDE_BY_SIDE}`}
      >
        <div
          className="w-full max-w-[800px] min-[1168px]:w-[800px] min-[1168px]:max-w-none min-[1168px]:shrink-0"
          style={{
            viewTransitionName: jumpPivot ? undefined : `month-${month}`,
          }}
        >
          <MonthCard
            month={detail.month}
            year={year}
            weekStart={weekStart}
            size="lg"
            spacious
            onDayClick={onDayClick}
            pivotDay={pivotDay}
            jumpDay={jumpPivot}
            events={events}
            onEventSelect={openEdit}
          />
        </div>

        {countdowns && (
          <div className="w-full max-w-[800px] min-[713px]:hidden">
            <CountdownChips countdowns={countdowns} block />
          </div>
        )}

        <aside
          className="w-full max-w-[800px] rounded-xl border p-4 min-[1168px]:w-auto min-[1168px]:max-w-none min-[1168px]:flex-1"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
          }}
        >
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{detail.month.labelJa}</span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {detail.month.labelEn} / {detail.month.labelWafu}
            </span>
          </div>
          <div className="mb-4 grid grid-cols-4 justify-items-start gap-2">
            <Stat label="祝日" value={detail.holidayCount} unit="日" />
            <Stat label="総日数" value={detail.dayCount} unit="日" />
            <Stat label="営業日" value={detail.businessDayCount} unit="日" />
            <Stat
              label="営業日残"
              value={detail.businessDaysRemaining}
              unit="日"
            />
          </div>
          <h2
            className="mb-2 text-xs font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            祝日
          </h2>
          {detail.holidays.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              祝日なし
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {detail.holidays.map((h) => (
                <li
                  key={`${h.date.month}-${h.date.day}-${h.name}`}
                  className="grid grid-cols-[4.75rem_1fr] items-baseline gap-2 text-sm"
                >
                  <span
                    className="tabular-nums"
                    style={{ color: "var(--accent-red)" }}
                  >
                    {h.date.month}/{h.date.day}
                    <span
                      className="ml-1 text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      (
                      {
                        WEEKDAY_JA[
                          new Date(
                            Date.UTC(h.date.year, h.date.month - 1, h.date.day),
                          ).getUTCDay()
                        ]
                      }
                      )
                    </span>
                  </span>
                  <span>{h.name}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-lg leading-none font-bold tabular-nums">
        {value}
        <span
          className="ml-0.5 text-[10px] font-normal"
          style={{ color: "var(--text-muted)" }}
        >
          {unit}
        </span>
      </span>
    </div>
  );
}
