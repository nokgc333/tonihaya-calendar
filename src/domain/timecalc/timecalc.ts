/** 時刻（0–23時・0–59分） */
export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
}

/** 時間量（時・分。24時間を超えうる純粋な量） */
export interface Duration {
  readonly hours: number;
  readonly minutes: number;
}

/** 暦日 */
export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** 時刻演算の結果（日跨ぎ数を含む） */
export interface TimeResult {
  readonly time: TimeOfDay;
  readonly dayOffset: number;
}

import { fromEpochDay, toEpochDay } from "../shared/date";

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

const toMinutes = (time: TimeOfDay): number => time.hour * MINUTES_PER_HOUR + time.minute;

/** 正の剰余（負数対応） */
const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** ①時刻 ± 時間（分）。日跨ぎ数を dayOffset に返す */
export function addDurationToTime(time: TimeOfDay, deltaMinutes: number): TimeResult {
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

/** ②時刻間の差分（end − start、翌日跨ぎを考慮し 0〜23:59 に正規化） */
export function diffTime(start: TimeOfDay, end: TimeOfDay): Duration {
  const diff = mod(toMinutes(end) - toMinutes(start), MINUTES_PER_DAY);
  return {
    hours: Math.floor(diff / MINUTES_PER_HOUR),
    minutes: diff % MINUTES_PER_HOUR,
  };
}

/** ③日付 ± 日数 */
export function addDays(date: CivilDate, days: number): CivilDate {
  return fromEpochDay(toEpochDay(date.year, date.month, date.day) + days);
}

/** ③日付間の差分（to − from、日数） */
export function diffDays(from: CivilDate, to: CivilDate): number {
  return toEpochDay(to.year, to.month, to.day) - toEpochDay(from.year, from.month, from.day);
}

/** ④時間の加減算（24時間を超える純粋な時間量。hours は無制限） */
export function addDurations(a: Duration, b: Duration): Duration {
  const total =
    a.hours * MINUTES_PER_HOUR + a.minutes + (b.hours * MINUTES_PER_HOUR + b.minutes);
  return {
    hours: Math.floor(total / MINUTES_PER_HOUR),
    minutes: total % MINUTES_PER_HOUR,
  };
}
