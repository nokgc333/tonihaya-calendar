import type { WeekDay } from "@/domain/view";
import { dayBgColor } from "@/components/common/dayPalette";
import { DayTimedEvents } from "@/components/timeline/DayTimedEvents";
import {
  DAY_GRID_COLS,
  HOURS,
  HOUR_HEIGHT,
} from "@/components/timeline/timelineLayout";

function HourRow({
  hour,
  day,
}: {
  readonly hour: number;
  readonly day: WeekDay;
}) {
  return (
    <div className="contents">
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
      <div
        className="border-t border-l"
        style={{
          height: HOUR_HEIGHT,
          borderColor: "var(--border)",
          background: dayBgColor(day),
        }}
      />
    </div>
  );
}

export function DayHourGrid({
  day,
  nowOffset,
  onSelect,
}: {
  readonly day: WeekDay;
  readonly nowOffset: number;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div
      className="relative grid"
      style={{ gridTemplateColumns: DAY_GRID_COLS }}
    >
      {HOURS.map((h) => (
        <HourRow key={h} hour={h} day={day} />
      ))}
      <DayTimedEvents
        date={{ year: day.year, month: day.month, day: day.day }}
        hourHeight={HOUR_HEIGHT}
        dayLeft="3.5rem"
        dayWidth="(100% - 3.5rem)"
        onSelect={onSelect}
      />
      {day.isToday && (
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
  );
}
