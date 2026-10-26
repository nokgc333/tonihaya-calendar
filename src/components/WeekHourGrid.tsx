import { Fragment } from "react";
import type { WeekDay } from "@/domain/view";
import { dayBgColor } from "@/components/dayPalette";
import { DayTimedEvents } from "@/components/DayTimedEvents";
import { GRID_COLS, HOURS, HOUR_HEIGHT } from "@/components/weekLayout";

function HourRow({
  hour,
  days,
  onOpen,
}: {
  readonly hour: number;
  readonly days: readonly WeekDay[];
  readonly onOpen: (year: number, month: number, day: number) => void;
}) {
  return (
    <Fragment>
      <div
        className="border-t pr-1 text-right text-[10px]"
        style={{
          height: HOUR_HEIGHT,
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        {hour}:00
      </div>
      {days.map((d) => (
        <button
          key={`c-${hour}-${d.month}-${d.day}`}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => onOpen(d.year, d.month, d.day)}
          className="w-full cursor-pointer border-t border-l transition-opacity hover:opacity-80"
          style={{
            height: HOUR_HEIGHT,
            borderColor: "var(--border)",
            background: dayBgColor(d),
          }}
        />
      ))}
    </Fragment>
  );
}

function NowLine({
  todayIndex,
  offset,
}: {
  readonly todayIndex: number;
  readonly offset: number;
}) {
  return (
    <div
      className="pointer-events-none absolute z-[6]"
      style={{
        top: offset,
        left: `calc(3.5rem + ${todayIndex} * (100% - 3.5rem) / 7)`,
        width: `calc((100% - 3.5rem) / 7)`,
        borderTop: "2px solid var(--accent-red)",
      }}
    />
  );
}

export function WeekHourGrid({
  days,
  todayIndex,
  nowOffset,
  onOpen,
  onSelect,
}: {
  readonly days: readonly WeekDay[];
  readonly todayIndex: number;
  readonly nowOffset: number;
  readonly onOpen: (year: number, month: number, day: number) => void;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div className="relative grid" style={{ gridTemplateColumns: GRID_COLS }}>
      {HOURS.map((h) => (
        <HourRow key={h} hour={h} days={days} onOpen={onOpen} />
      ))}
      {days.map((d, i) => (
        <DayTimedEvents
          key={`ev-${d.month}-${d.day}`}
          date={{ year: d.year, month: d.month, day: d.day }}
          hourHeight={HOUR_HEIGHT}
          dayLeft={`(3.5rem + (100% - 3.5rem) * ${i} / 7)`}
          dayWidth="((100% - 3.5rem) / 7)"
          onSelect={onSelect}
        />
      ))}
      {todayIndex >= 0 && (
        <NowLine todayIndex={todayIndex} offset={nowOffset} />
      )}
    </div>
  );
}
