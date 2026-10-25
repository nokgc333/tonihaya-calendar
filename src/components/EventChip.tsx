import type { CalendarEvent } from "@/domain/event";
import { eventColor } from "@/components/eventColors";

const pad = (n: number): string => String(n).padStart(2, "0");

export function EventChip({
  event,
  onSelect,
}: {
  readonly event: CalendarEvent;
  readonly onSelect?: (id: string) => void;
}) {
  const c = eventColor(event.colorKey);
  const time =
    !event.allDay && event.start.time
      ? `${pad(event.start.time.hour)}:${pad(event.start.time.minute)} `
      : "";
  return (
    <button
      type="button"
      data-event-id={event.id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(event.id);
      }}
      className="block w-full truncate rounded px-1 text-left text-[10px] leading-[1.35] transition-opacity hover:opacity-90"
      style={{ background: c.bg, color: c.fg }}
      title={event.title}
    >
      {time}
      {event.title}
    </button>
  );
}
