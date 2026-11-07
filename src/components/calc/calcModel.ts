import {
  addDays,
  addDurationToTime,
  addDurations,
  diffDays,
  diffTime,
  subtractDurations,
  type CivilDate,
  type Duration,
  type TimeOfDay,
} from "@/domain/timecalc";
import { toEpochDay, fromEpochDay, weekdayOf } from "@/domain/shared/date";
import { WEEKDAY_JA } from "@/components/common/weekdays";

export type Sign = 1 | -1;

const MINUS = "−";
const MAX_COUNT = 99_999;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseTime(value: string): TimeOfDay | null {
  const match = TIME_PATTERN.exec(value);
  if (match === null) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export function parseDate(value: string): CivilDate | null {
  const match = DATE_PATTERN.exec(value);
  if (match === null) return null;
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const back = fromEpochDay(toEpochDay(date.year, date.month, date.day));
  const same =
    back.year === date.year &&
    back.month === date.month &&
    back.day === date.day;
  return date.year >= 1 && same ? date : null;
}

export function parseCount(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const count = Number(value);
  return count <= MAX_COUNT ? count : null;
}

function parseDuration(hours: string, minutes: string): Duration | null {
  const h = parseCount(hours === "" ? "0" : hours);
  const m = parseCount(minutes === "" ? "0" : minutes);
  return h === null || m === null ? null : { hours: h, minutes: m };
}

export function formatTime({ hour, minute }: TimeOfDay): string {
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

export function formatDuration({ hours, minutes }: Duration): string {
  if (hours === 0) return `${minutes}分`;
  return minutes === 0 ? `${hours}時間` : `${hours}時間${minutes}分`;
}

function dayOffsetNote(offset: number): string {
  if (offset === 0) return "";
  if (offset === 1) return "（翌日）";
  if (offset === -1) return "（前日）";
  return offset > 0 ? `（${offset}日後）` : `（${-offset}日前）`;
}

export function formatDate(date: CivilDate): string {
  const weekday = WEEKDAY_JA[weekdayOf(date.year, date.month, date.day)];
  return `${date.year}年${date.month}月${date.day}日（${weekday}）`;
}

export function timePlusMinus(
  time: string,
  sign: Sign,
  hours: string,
  minutes: string,
): string | null {
  const start = parseTime(time);
  const duration = parseDuration(hours, minutes);
  if (start === null || duration === null) return null;
  const delta = sign * (duration.hours * 60 + duration.minutes);
  const { time: result, dayOffset } = addDurationToTime(start, delta);
  return `${formatTime(result)}${dayOffsetNote(dayOffset)}`;
}

export function timeDifference(start: string, end: string): string | null {
  const from = parseTime(start);
  const to = parseTime(end);
  if (from === null || to === null) return null;
  return formatDuration(diffTime(from, to));
}

export function datePlusMinus(
  date: string,
  sign: Sign,
  days: string,
): string | null {
  const start = parseDate(date);
  const count = parseCount(days);
  if (start === null || count === null) return null;
  const result = addDays(start, sign * count);
  return result.year >= 1 && result.year <= 9999 ? formatDate(result) : null;
}

export function dateDifference(from: string, to: string): string | null {
  const start = parseDate(from);
  const end = parseDate(to);
  if (start === null || end === null) return null;
  const days = diffDays(start, end);
  return `${days < 0 ? MINUS : ""}${Math.abs(days)}日`;
}

export function durationPlusMinus(
  first: { readonly hours: string; readonly minutes: string },
  sign: Sign,
  second: { readonly hours: string; readonly minutes: string },
): string | null {
  const a = parseDuration(first.hours, first.minutes);
  const b = parseDuration(second.hours, second.minutes);
  if (a === null || b === null) return null;
  if (sign === 1) return formatDuration(addDurations(a, b));
  const result = subtractDurations(a, b);
  return `${result.negative ? MINUS : ""}${formatDuration(result)}`;
}
