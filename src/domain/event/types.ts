import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";

export type EventColorKey =
  | "blue"
  | "green"
  | "teal"
  | "purple"
  | "pink"
  | "amber"
  | "slate"
  | "rose";

export type EventPriority = "low" | "normal" | "high";

export interface EventPoint {
  readonly date: CivilDate;
  readonly time?: TimeOfDay; // 時間イベント時のみ
}

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly allDay: boolean;
  readonly start: EventPoint;
  readonly end: EventPoint;
  readonly colorKey: EventColorKey;
  readonly priority: EventPriority;
  readonly url?: string;
  readonly note?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}
