import type { CalendarEvent } from "@/domain/event";
import type { WeekDay } from "@/domain/view";
import { AllDayCell, AllDayLabel } from "@/components/AllDayCell";
import { GRID_COLS } from "@/components/weekLayout";

export function WeekAllDayRow({
  days,
  events,
  onSelect,
}: {
  readonly days: readonly WeekDay[];
  readonly events: readonly CalendarEvent[];
  readonly onSelect: (id: string) => void;
}) {
  return (
    <div
      className="grid shrink-0 border-y"
      style={{
        gridTemplateColumns: GRID_COLS,
        borderColor: "var(--border-strong)",
      }}
    >
      <AllDayLabel />
      {days.map((d) => (
        <AllDayCell
          key={`a-${d.month}-${d.day}`}
          day={d}
          events={events}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
