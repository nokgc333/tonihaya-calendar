import type { CSSProperties } from "react";
import type { WeekDay } from "@/domain/view";
import { dayTextColor } from "@/components/common/dayPalette";
import { WEEKDAY_JA } from "@/components/common/weekdays";
import { GRID_COLS } from "@/components/timeline/timelineLayout";

function transitionStyle(isPivot: boolean, isJump: boolean): CSSProperties {
  if (isPivot) return { viewTransitionName: "hour-zoom" };
  if (isJump) return { viewTransitionName: "jump-zoom" };
  return {};
}

function DayNumber({ day }: { readonly day: WeekDay }) {
  return (
    <span className="relative inline-flex items-center justify-center">
      {day.isHoliday ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "var(--holiday-disc)",
            width: "calc(1.5em + 1px)",
            height: "calc(1.5em + 1px)",
          }}
        />
      ) : null}
      <span
        className="relative"
        style={{ color: dayTextColor(day) }}
        {...(day.isToday ? { "aria-current": "date" as const } : {})}
      >
        {day.day}
      </span>
    </span>
  );
}

function DayHeaderButton({
  day,
  isPivot,
  isJump,
  onOpen,
}: {
  readonly day: WeekDay;
  readonly isPivot: boolean;
  readonly isJump: boolean;
  readonly onOpen: (year: number, month: number, day: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(day.year, day.month, day.day)}
      className="w-full cursor-pointer px-1 py-[7px] text-center transition-opacity hover:opacity-70"
      style={{
        ...transitionStyle(isPivot, isJump),
        ...(day.isToday
          ? { boxShadow: "inset 0 0 0 1.5px var(--today-bg)" }
          : {}),
      }}
      aria-label={`${WEEKDAY_JA[day.weekday]}${day.day} ${day.month}月${day.day}日を開く`}
    >
      <div className="text-[11px]" style={{ color: dayTextColor(day) }}>
        {WEEKDAY_JA[day.weekday]}
      </div>
      <div className="text-base font-bold tabular-nums">
        <DayNumber day={day} />
      </div>
    </button>
  );
}

export function WeekDayHeaders({
  days,
  isDayZoom,
  isPivot,
  isJump,
  onOpen,
}: {
  readonly days: readonly WeekDay[];
  readonly isDayZoom: boolean;
  readonly isPivot: (day: WeekDay) => boolean;
  readonly isJump: (day: WeekDay) => boolean;
  readonly onOpen: (year: number, month: number, day: number) => void;
}) {
  return (
    <div
      className="sticky top-0 z-10 grid shrink-0"
      style={{
        gridTemplateColumns: GRID_COLS,
        background: "var(--surface)",
        viewTransitionName: isDayZoom ? "day-zoom" : undefined,
      }}
    >
      <div />
      {days.map((d) => (
        <DayHeaderButton
          key={`h-${d.month}-${d.day}`}
          day={d}
          isPivot={isPivot(d)}
          isJump={isJump(d)}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
