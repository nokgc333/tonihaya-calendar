"use client";

import type { CivilDate } from "@/domain/shared/date";
import { toEpochDay, weekdayOf } from "@/domain/shared/date";
import { getHolidaysInYear, type Holiday } from "@/domain/holiday";
import { WEEKDAY_JA } from "@/components/weekdays";

export function HolidayList({
  year,
  today,
  onMonthClick,
}: {
  readonly year: number;
  readonly today: CivilDate | null;
  readonly onMonthClick: (month: number) => void;
}) {
  const holidays = getHolidaysInYear(year);
  const isCurrentYear = today !== null && year === today.year;
  const todayEpoch = today
    ? toEpochDay(today.year, today.month, today.day)
    : null;

  return (
    <div
      className="sticky top-5 max-h-[calc(100dvh-2.5rem)] self-start overflow-y-auto rounded-lg border px-3 py-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          祝日一覧
        </h2>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "var(--text-faint)" }}
        >
          {year}年 / {holidays.length}日
        </span>
      </div>

      {holidays.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          祝日なし
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {holidays.map((h) => (
            <li key={`${h.date.month}-${h.date.day}-${h.name}`}>
              <HolidayRow
                holiday={h}
                isPast={
                  isCurrentYear &&
                  todayEpoch !== null &&
                  rowEpoch(h) < todayEpoch
                }
                isToday={
                  isCurrentYear &&
                  todayEpoch !== null &&
                  rowEpoch(h) === todayEpoch
                }
                isCurrentMonth={
                  isCurrentYear &&
                  today !== null &&
                  h.date.month === today.month
                }
                onClick={() => onMonthClick(h.date.month)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function rowEpoch(h: Holiday): number {
  return toEpochDay(h.date.year, h.date.month, h.date.day);
}

function HolidayRow({
  holiday,
  isPast,
  isToday,
  isCurrentMonth,
  onClick,
}: {
  readonly holiday: Holiday;
  readonly isPast: boolean;
  readonly isToday: boolean;
  readonly isCurrentMonth: boolean;
  readonly onClick: () => void;
}) {
  const { date, name } = holiday;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${date.month}月${date.day}日 ${name}、${date.month}月へ移動`}
      className="grid w-full grid-cols-[4rem_1fr] items-baseline gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-[var(--surface-2)]"
      style={{
        background: isToday ? "var(--surface-2)" : undefined,
        fontWeight: isToday || isCurrentMonth ? 700 : undefined,
      }}
    >
      <span
        className="tabular-nums"
        style={{ color: isPast ? "var(--text-faint)" : "var(--accent-red)" }}
      >
        {date.month}/{date.day}
        <span
          className="ml-1 text-[10px]"
          style={{ color: isPast ? "var(--text-faint)" : "var(--text-muted)" }}
        >
          ({WEEKDAY_JA[weekdayOf(date.year, date.month, date.day)]})
        </span>
      </span>
      <span
        className="truncate"
        style={{ color: isPast ? "var(--text-muted)" : "var(--text)" }}
      >
        {name}
      </span>
    </button>
  );
}
