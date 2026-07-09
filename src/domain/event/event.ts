import { toEpochDay } from "@/domain/shared/date";
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";
import type { CalendarEvent, EventPriority } from "./types";

export function minutesOfDay(t: TimeOfDay): number {
  return t.hour * 60 + t.minute;
}

const epoch = (d: CivilDate): number => toEpochDay(d.year, d.month, d.day);

export function eventsForDay(
  events: readonly CalendarEvent[],
  date: CivilDate,
): readonly CalendarEvent[] {
  const d = epoch(date);
  return events.filter((e) => epoch(e.start.date) <= d && d <= epoch(e.end.date));
}

const PRIORITY_RANK: Record<EventPriority, number> = { high: 0, normal: 1, low: 2 };

export function sortForDay(events: readonly CalendarEvent[]): readonly CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1; // 終日を先に
    if (!a.allDay && !b.allDay) {
      const am = minutesOfDay(a.start.time!);
      const bm = minutesOfDay(b.start.time!);
      if (am !== bm) return am - bm;
    }
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    return a.createdAt - b.createdAt;
  });
}
