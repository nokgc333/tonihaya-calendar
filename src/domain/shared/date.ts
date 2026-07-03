const MS_PER_DAY = 86_400_000;

/** 曜日（0=日曜 … 6=土曜）。UTC基準でタイムゾーン影響を排除 */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** 通日（epoch day）。UTC基準で日付差の計算に使う */
export function toEpochDay(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}
