import { toEpochDay } from "@/domain/shared/date";
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";
import type { CalendarEvent } from "./types";

export type EventDraft = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;

export function minutesOfDay(t: TimeOfDay): number {
  return t.hour * 60 + t.minute;
}

const epoch = (d: CivilDate): number => toEpochDay(d.year, d.month, d.day);

export function eventsForDay(
  events: readonly CalendarEvent[],
  date: CivilDate,
): readonly CalendarEvent[] {
  const d = epoch(date);
  return events.filter(
    (e) => epoch(e.start.date) <= d && d <= epoch(e.end.date),
  );
}

export interface DaySegment {
  readonly event: CalendarEvent;
  readonly startMin: number;
  readonly endMin: number;
  readonly continuesFromPrev: boolean;
  readonly continuesToNext: boolean;
}

export function clipEventToDay(
  event: CalendarEvent,
  date: CivilDate,
): DaySegment | null {
  if (event.allDay) return null;
  const d = epoch(date);
  const s = epoch(event.start.date);
  const e = epoch(event.end.date);
  if (d < s || d > e) return null;
  const startMin = d === s ? minutesOfDay(event.start.time!) : 0;
  const endMin = d === e ? minutesOfDay(event.end.time!) : 1440;
  return {
    event,
    startMin,
    endMin,
    continuesFromPrev: d > s,
    continuesToNext: d < e,
  };
}
