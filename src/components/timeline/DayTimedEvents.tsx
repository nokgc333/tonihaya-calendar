"use client";

import { useEvents } from "@/hooks/useEvents";
import {
  clipEventToDay,
  eventsForDay,
  layoutDayColumns,
  type DaySegment,
} from "@/domain/event";
import { eventColor } from "@/components/event/eventColors";
import type { CivilDate } from "@/domain/shared/date";

export function DayTimedEvents({
  date,
  hourHeight,
  dayLeft,
  dayWidth,
  onSelect,
}: {
  readonly date: CivilDate;
  readonly hourHeight: number;
  readonly dayLeft: string;
  readonly dayWidth: string;
  readonly onSelect?: (id: string) => void;
}) {
  const { events } = useEvents();
  const segments: DaySegment[] = eventsForDay(events, date)
    .map((e) => clipEventToDay(e, date))
    .filter((s): s is DaySegment => s !== null);
  const laid = layoutDayColumns(segments);

  return (
    <>
      {laid.map((s) => {
        const c = eventColor(s.event.colorKey);
        const top = (s.startMin / 60) * hourHeight;
        const height = Math.max(
          ((s.endMin - s.startMin) / 60) * hourHeight,
          14,
        );
        const frac = 1 / s.columnCount;
        return (
          <button
            key={s.event.id}
            type="button"
            onClick={() => onSelect?.(s.event.id)}
            data-event-id={s.event.id}
            className="absolute z-[5] overflow-hidden rounded px-1 text-left text-[11px] leading-tight transition-opacity hover:opacity-90"
            style={{
              top,
              height,
              left: `calc(${dayLeft} + (${dayWidth}) * ${s.columnIndex * frac})`,
              width: `calc((${dayWidth}) * ${frac} - 2px)`,
              background: c.bg,
              color: c.fg,
              border: `1px solid ${c.border}`,
            }}
            aria-label={`${s.event.title} を編集`}
          >
            {s.continuesFromPrev ? "‹ " : ""}
            {s.event.title}
            {s.continuesToNext ? " ›" : ""}
          </button>
        );
      })}
    </>
  );
}
