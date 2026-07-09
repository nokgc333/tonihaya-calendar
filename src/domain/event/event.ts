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
  return events.filter((e) => epoch(e.start.date) <= d && d <= epoch(e.end.date));
}

export interface DaySegment {
  readonly event: CalendarEvent;
  readonly startMin: number;
  readonly endMin: number;
  readonly continuesFromPrev: boolean;
  readonly continuesToNext: boolean;
}

export function clipEventToDay(event: CalendarEvent, date: CivilDate): DaySegment | null {
  if (event.allDay) return null;
  const d = epoch(date);
  const s = epoch(event.start.date);
  const e = epoch(event.end.date);
  if (d < s || d > e) return null;
  const startMin = d === s ? minutesOfDay(event.start.time!) : 0;
  const endMin = d === e ? minutesOfDay(event.end.time!) : 1440;
  return { event, startMin, endMin, continuesFromPrev: d > s, continuesToNext: d < e };
}

export interface LaidOutSegment extends DaySegment {
  readonly columnIndex: number;
  readonly columnCount: number;
}

// 重なる時間イベントを、重なりクラスタ単位で列（レーン）に割り当てる。
// columnIndex/columnCount から幅=100%/columnCount・左=columnIndex分 を算出して横並び表示する。
export function layoutDayColumns(segments: readonly DaySegment[]): readonly LaidOutSegment[] {
  const sorted = [...segments].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
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
    // 現クラスタのどれとも重ならない（開始が全終了以降）なら、クラスタを確定して次へ。
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

export function validateEvent(d: EventDraft): readonly string[] {
  const errors: string[] = [];
  if (d.title.trim().length === 0) errors.push("タイトルを入力してください");
  if (d.url && !isSafeUrl(d.url)) errors.push("URLは http/https のみ使用できます");
  const s = epoch(d.start.date);
  const e = epoch(d.end.date);
  if (e < s) errors.push("終了日は開始日以降にしてください");
  if (!d.allDay) {
    if (!d.start.time || !d.end.time) {
      errors.push("時間イベントは開始・終了時刻が必要です");
    } else if (s === e && minutesOfDay(d.end.time) <= minutesOfDay(d.start.time)) {
      errors.push("終了時刻は開始時刻より後にしてください");
    }
  }
  return errors;
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
