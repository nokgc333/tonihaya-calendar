import { toEpochDay } from "@/domain/shared/date";
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";
import type { CalendarEvent, EventPriority } from "./types";

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

export interface LaidOutSegment extends DaySegment {
  readonly columnIndex: number;
  readonly columnCount: number;
}

export function layoutDayColumns(
  segments: readonly DaySegment[],
): readonly LaidOutSegment[] {
  const sorted = [...segments].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin,
  );
  const out: LaidOutSegment[] = [];
  let cluster: Array<DaySegment & { columnIndex: number }> = [];
  let clusterMaxEnd = -1;

  const flush = (): void => {
    const count = cluster.reduce((m, c) => Math.max(m, c.columnIndex + 1), 0);
    for (const c of cluster) out.push({ ...c, columnCount: count });
    cluster = [];
    clusterMaxEnd = -1;
  };

  for (const s of sorted) {
    if (cluster.length > 0 && s.startMin >= clusterMaxEnd) flush();
    const occupied = new Set(
      cluster.filter((c) => c.endMin > s.startMin).map((c) => c.columnIndex),
    );
    let col = 0;
    while (occupied.has(col)) col++;
    cluster.push({ ...s, columnIndex: col });
    clusterMaxEnd = Math.max(clusterMaxEnd, s.endMin);
  }
  flush();
  return out;
}

export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const TITLE_MAX_LENGTH = 200;
export const NOTE_MAX_LENGTH = 2000;
export const URL_MAX_LENGTH = 2048;

type EventRule = (d: EventDraft) => readonly string[];

const when = (condition: boolean, message: string): readonly string[] =>
  condition ? [message] : [];

const titleErrors: EventRule = (d) => [
  ...when(d.title.trim().length === 0, "タイトルを入力してください"),
  ...when(
    d.title.length > TITLE_MAX_LENGTH,
    `タイトルは${TITLE_MAX_LENGTH}文字以内にしてください`,
  ),
];

const noteErrors: EventRule = (d) =>
  when(
    Boolean(d.note) && (d.note?.length ?? 0) > NOTE_MAX_LENGTH,
    `備考は${NOTE_MAX_LENGTH}文字以内にしてください`,
  );

const urlErrors: EventRule = (d) => [
  ...when(
    Boolean(d.url) && !isSafeUrl(d.url ?? ""),
    "URLは http/https のみ使用できます",
  ),
  ...when(
    Boolean(d.url) && (d.url?.length ?? 0) > URL_MAX_LENGTH,
    `URLは${URL_MAX_LENGTH}文字以内にしてください`,
  ),
];

const dateErrors: EventRule = (d) =>
  when(
    epoch(d.end.date) < epoch(d.start.date),
    "終了日は開始日以降にしてください",
  );

const timeErrors: EventRule = (d) => {
  if (d.allDay) return [];
  if (!d.start.time || !d.end.time) {
    return ["時間イベントは開始・終了時刻が必要です"];
  }
  const isSameDay = epoch(d.start.date) === epoch(d.end.date);
  return when(
    isSameDay && minutesOfDay(d.end.time) <= minutesOfDay(d.start.time),
    "終了時刻は開始時刻より後にしてください",
  );
};

const EVENT_RULES: readonly EventRule[] = [
  titleErrors,
  noteErrors,
  urlErrors,
  dateErrors,
  timeErrors,
];

export function validateEvent(d: EventDraft): readonly string[] {
  return EVENT_RULES.flatMap((rule) => rule(d));
}

const PRIORITY_RANK: Record<EventPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function sortForDay(
  events: readonly CalendarEvent[],
): readonly CalendarEvent[] {
  return [...events].sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
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
