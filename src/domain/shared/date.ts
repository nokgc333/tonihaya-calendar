const MS_PER_DAY = 86_400_000;

/** 曜日（0=日曜 … 6=土曜）。UTC基準でタイムゾーン影響を排除 */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** 通日（epoch day）。UTC基準で日付差の計算に使う */
export function toEpochDay(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

/** 通日から暦日（year/month/day）へ復元 */
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

/** 指定した年月の日数（翌月0日=当月末日をUTC基準で算出）。 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
