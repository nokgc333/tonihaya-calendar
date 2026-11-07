import { daysInMonth } from "@/domain/calendar";
import { toEpochDay } from "@/domain/shared/date";
import {
  NOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  URL_MAX_LENGTH,
  isSafeUrl,
  minutesOfDay,
} from "./event";
import type {
  CalendarEvent,
  EventColorKey,
  EventPoint,
  EventPriority,
} from "./types";

const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;

const COLOR_KEYS: readonly EventColorKey[] = [
  "blue",
  "green",
  "teal",
  "purple",
  "pink",
  "amber",
  "slate",
  "rose",
];
const PRIORITIES: readonly EventPriority[] = ["low", "normal", "high"];

export type StoredParse =
  | {
      readonly ok: true;
      readonly event: CalendarEvent;
      readonly repaired: readonly string[];
    }
  | { readonly ok: false; readonly reason: string };

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isIntIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function readDate(v: unknown): EventPoint["date"] | null {
  if (!isObject(v)) return null;
  const { year, month, day } = v;
  if (!isIntIn(year, MIN_YEAR, MAX_YEAR) || !isIntIn(month, 1, 12)) return null;
  if (!isIntIn(day, 1, daysInMonth(year, month))) return null;
  return { year, month, day };
}

function readTime(v: unknown): EventPoint["time"] | null {
  if (!isObject(v)) return null;
  const { hour, minute } = v;
  if (!isIntIn(hour, 0, HOURS_PER_DAY - 1)) return null;
  if (!isIntIn(minute, 0, MINUTES_PER_HOUR - 1)) return null;
  return { hour, minute };
}

function readPoint(v: unknown, requireTime: boolean): EventPoint | null {
  if (!isObject(v)) return null;
  const date = readDate(v.date);
  if (date === null) return null;
  if (!requireTime) return { date };
  const time = readTime(v.time);
  return time === null ? null : { date, time };
}

const instant = (p: EventPoint): number =>
  toEpochDay(p.date.year, p.date.month, p.date.day) * 24 * 60 +
  (p.time ? minutesOfDay(p.time) : 0);

function readOptionalText(
  v: unknown,
  field: string,
  limit: number,
  repaired: string[],
): string | undefined | null {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return null;
  if (v.length <= limit) return v;
  repaired.push(field);
  return v.slice(0, limit);
}

function readUrl(v: unknown, repaired: string[]): string | undefined | null {
  if (v === undefined) return undefined;
  if (typeof v !== "string") return null;
  if (v.length <= URL_MAX_LENGTH && isSafeUrl(v)) return v;
  repaired.push("url");
  return undefined;
}

const reject = (field: string): StoredParse => ({
  ok: false,
  reason: `${field} is not valid`,
});

const SCALAR_CHECKS: readonly (readonly [string, (v: unknown) => boolean])[] = [
  ["id", (v) => typeof v === "string" && v.length > 0],
  ["title", (v) => typeof v === "string"],
  ["allDay", (v) => typeof v === "boolean"],
  ["colorKey", (v) => COLOR_KEYS.includes(v as EventColorKey)],
  ["priority", (v) => PRIORITIES.includes(v as EventPriority)],
  ["createdAt", isFiniteNumber],
  ["updatedAt", isFiniteNumber],
];

function firstBadScalar(v: Obj): string | null {
  const bad = SCALAR_CHECKS.find(([field, isValid]) => !isValid(v[field]));
  return bad ? bad[0] : null;
}

interface Points {
  readonly start: EventPoint;
  readonly end: EventPoint;
}

function readPoints(v: Obj): Points | string {
  const withTime = v.allDay === false;
  const start = readPoint(v.start, withTime);
  if (start === null) return "start";
  const end = readPoint(v.end, withTime);
  if (end === null) return "end";
  if (instant(end) < instant(start)) return "end (it is before start)";
  if (withTime && instant(end) === instant(start)) {
    return "end (it is the same as start)";
  }
  return { start, end };
}

interface Texts {
  readonly title: string;
  readonly url: string | undefined;
  readonly note: string | undefined;
}

function readTexts(v: Obj, repaired: string[]): Texts | string {
  const title = readOptionalText(v.title, "title", TITLE_MAX_LENGTH, repaired);
  const note = readOptionalText(v.note, "note", NOTE_MAX_LENGTH, repaired);
  if (note === null) return "note";
  const url = readUrl(v.url, repaired);
  if (url === null) return "url";
  return { title: title ?? "", url, note };
}

export function parseStoredEvent(v: unknown): StoredParse {
  if (!isObject(v)) return reject("the event");
  const badScalar = firstBadScalar(v);
  if (badScalar !== null) return reject(badScalar);
  const points = readPoints(v);
  if (typeof points === "string") return reject(points);
  const repaired: string[] = [];
  const texts = readTexts(v, repaired);
  if (typeof texts === "string") return reject(texts);

  const event: CalendarEvent = {
    id: v.id as string,
    title: texts.title,
    allDay: v.allDay as boolean,
    start: points.start,
    end: points.end,
    colorKey: v.colorKey as EventColorKey,
    priority: v.priority as EventPriority,
    ...(texts.url === undefined ? {} : { url: texts.url }),
    ...(texts.note === undefined ? {} : { note: texts.note }),
    createdAt: v.createdAt as number,
    updatedAt: v.updatedAt as number,
  };
  return { ok: true, event, repaired: orderRepairs(repaired) };
}

const REPAIR_ORDER = ["title", "url", "note"];

function orderRepairs(repaired: readonly string[]): string[] {
  return [...repaired].sort(
    (a, b) => REPAIR_ORDER.indexOf(a) - REPAIR_ORDER.indexOf(b),
  );
}

export function isStoredCalendarEvent(v: unknown): v is CalendarEvent {
  const parsed = parseStoredEvent(v);
  return parsed.ok && parsed.repaired.length === 0;
}
