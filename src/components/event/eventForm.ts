import type {
  CalendarEvent,
  EventColorKey,
  EventDraft,
  EventPriority,
} from "@/domain/event";
import type { CivilDate } from "@/domain/shared/date";
import type { TimeOfDay } from "@/domain/timecalc";

export interface EventFormValues {
  readonly title: string;
  readonly allDay: boolean;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly colorKey: EventColorKey;
  readonly priority: EventPriority;
  readonly url: string;
  readonly note: string;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "10:00";

const pad = (n: number): string => String(n).padStart(2, "0");

export const toDateInput = (d: CivilDate): string =>
  `${d.year}-${pad(d.month)}-${pad(d.day)}`;

export const fromDateInput = (s: string): CivilDate => {
  const [year, month, day] = s.split("-").map(Number);
  return { year, month, day };
};

export const toTimeInput = (
  t: TimeOfDay | undefined,
  fallback: string,
): string => (t ? `${pad(t.hour)}:${pad(t.minute)}` : fallback);

export const fromTimeInput = (s: string): TimeOfDay => {
  const [hour, minute] = s.split(":").map(Number);
  return { hour, minute };
};

function newEventValues(defaultDate: CivilDate): EventFormValues {
  return {
    title: "",
    allDay: true,
    startDate: toDateInput(defaultDate),
    endDate: toDateInput(defaultDate),
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    colorKey: "blue",
    priority: "normal",
    url: "",
    note: "",
  };
}

function editedEventValues(event: CalendarEvent): EventFormValues {
  return {
    title: event.title,
    allDay: event.allDay,
    startDate: toDateInput(event.start.date),
    endDate: toDateInput(event.end.date),
    startTime: toTimeInput(event.start.time, DEFAULT_START_TIME),
    endTime: toTimeInput(event.end.time, DEFAULT_END_TIME),
    colorKey: event.colorKey,
    priority: event.priority,
    url: event.url ?? "",
    note: event.note ?? "",
  };
}

export function initialFormValues(
  initial: CalendarEvent | null,
  defaultDate: CivilDate,
): EventFormValues {
  return initial ? editedEventValues(initial) : newEventValues(defaultDate);
}

const trimmedOrUndefined = (s: string): string | undefined =>
  s.trim() ? s.trim() : undefined;

export function buildDraft(v: EventFormValues): EventDraft {
  return {
    title: v.title,
    allDay: v.allDay,
    start: {
      date: fromDateInput(v.startDate),
      time: v.allDay ? undefined : fromTimeInput(v.startTime),
    },
    end: {
      date: fromDateInput(v.endDate),
      time: v.allDay ? undefined : fromTimeInput(v.endTime),
    },
    colorKey: v.colorKey,
    priority: v.priority,
    url: trimmedOrUndefined(v.url),
    note: trimmedOrUndefined(v.note),
  };
}
