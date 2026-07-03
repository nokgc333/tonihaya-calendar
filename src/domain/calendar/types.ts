/** 週の開始曜日 */
export type WeekStart = "sun" | "mon";

/** カレンダーグリッド上の1日 */
export interface CalendarDay {
  /** 西暦（1950–2150想定） */
  readonly year: number;
  /** 月（1–12） */
  readonly month: number;
  /** 日（1–31） */
  readonly day: number;
  /** 曜日（0=日曜 … 6=土曜） */
  readonly weekday: number;
  /** 対象月に属する日なら true（前後月の埋め日は false） */
  readonly inMonth: boolean;
}

/** 7日で構成される1週 */
export type CalendarWeek = readonly CalendarDay[];
