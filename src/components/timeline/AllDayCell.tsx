import type { CalendarEvent } from "@/domain/event";
import { eventsForDay } from "@/domain/event";
import type { WeekDay } from "@/domain/view";
import { dayBgColor } from "@/components/common/dayPalette";
import { eventColor } from "@/components/event/eventColors";

function AllDayChip({
  event,
  onSelect,
}: {
  readonly event: CalendarEvent;
  readonly onSelect: (id: string) => void;
}) {
  const c = eventColor(event.colorKey);
  return (
    <button
      type="button"
      data-event-id={event.id}
      onClick={() => onSelect(event.id)}
      className="block w-full truncate rounded px-1 text-left leading-tight transition-opacity hover:opacity-90"
      style={{
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
      title={event.title}
    >
      {event.title}
    </button>
  );
}

export function AllDayCell({
  day,
  events,
  onSelect,
}: {
  readonly day: WeekDay;
  readonly events: readonly CalendarEvent[];
  readonly onSelect: (id: string) => void;
}) {
  const allDayEvents = eventsForDay(events, {
    year: day.year,
    month: day.month,
    day: day.day,
  }).filter((e) => e.allDay);
  return (
    <div
      className="min-h-[33px] space-y-0.5 border-l p-0.5 text-[10px]"
      style={{ borderColor: "var(--border)", background: dayBgColor(day) }}
    >
      {day.holidayName ? (
        <div className="text-center" style={{ color: "var(--accent-red)" }}>
          {day.holidayName}
        </div>
      ) : null}
      {allDayEvents.map((e) => (
        <AllDayChip key={e.id} event={e} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function AllDayLabel() {
  return (
    <div
      className="flex items-center justify-end p-1 text-[10px]"
      style={{ color: "var(--text-muted)" }}
    >
      終日
    </div>
  );
}
