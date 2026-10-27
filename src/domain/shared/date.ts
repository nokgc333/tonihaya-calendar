const MS_PER_DAY = 86_400_000;

export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function utcMillis(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
}

export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(utcMillis(year, month, day)).getUTCDay();
}

export function toEpochDay(year: number, month: number, day: number): number {
  return Math.floor(utcMillis(year, month, day) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): {
  year: number;
  month: number;
  day: number;
} {
  const date = new Date(epochDay * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(utcMillis(year, month + 1, 0)).getUTCDate();
}
