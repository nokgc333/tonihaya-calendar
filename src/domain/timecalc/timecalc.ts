export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
}

export interface Duration {
  readonly hours: number;
  readonly minutes: number;
}

export interface TimeResult {
  readonly time: TimeOfDay;
  readonly dayOffset: number;
}

import { fromEpochDay, toEpochDay, type CivilDate } from "../shared/date";

export type { CivilDate };

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

const toMinutes = (time: TimeOfDay): number =>
  time.hour * MINUTES_PER_HOUR + time.minute;

const mod = (n: number, m: number): number => ((n % m) + m) % m;

export function addDurationToTime(
  time: TimeOfDay,
  deltaMinutes: number,
): TimeResult {
  const total = toMinutes(time) + deltaMinutes;
  const dayOffset = Math.floor(total / MINUTES_PER_DAY);
  const withinDay = mod(total, MINUTES_PER_DAY);
  return {
    time: {
      hour: Math.floor(withinDay / MINUTES_PER_HOUR),
      minute: withinDay % MINUTES_PER_HOUR,
    },
    dayOffset,
  };
}

export function diffTime(start: TimeOfDay, end: TimeOfDay): Duration {
  const diff = mod(toMinutes(end) - toMinutes(start), MINUTES_PER_DAY);
  return {
    hours: Math.floor(diff / MINUTES_PER_HOUR),
    minutes: diff % MINUTES_PER_HOUR,
  };
}

export function addDays(date: CivilDate, days: number): CivilDate {
  return fromEpochDay(toEpochDay(date.year, date.month, date.day) + days);
}

export function diffDays(from: CivilDate, to: CivilDate): number {
  return (
    toEpochDay(to.year, to.month, to.day) -
    toEpochDay(from.year, from.month, from.day)
  );
}

export function addDurations(a: Duration, b: Duration): Duration {
  const total =
    a.hours * MINUTES_PER_HOUR +
    a.minutes +
    (b.hours * MINUTES_PER_HOUR + b.minutes);
  return {
    hours: Math.floor(total / MINUTES_PER_HOUR),
    minutes: total % MINUTES_PER_HOUR,
  };
}
