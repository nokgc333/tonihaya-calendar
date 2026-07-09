/**
 * 曜日・祝日に応じた文字色/背景色（CSSトークン）。
 * 週ビュー・日ビュー・月グリッドで共通の配色ロジックを1箇所に集約する。
 * WeekDay / DayCell の共通部分だけを受け取る最小形（DayLike）で汎用化する。
 */
interface DayLike {
  readonly isSunday: boolean;
  readonly isSaturday: boolean;
  readonly isHoliday: boolean;
}

/** 文字色: 日祝=赤 / 土=青 / 平日=標準。 */
export function dayTextColor(d: DayLike): string {
  if (d.isSunday || d.isHoliday) return "var(--accent-red)";
  if (d.isSaturday) return "var(--accent-sat)";
  return "var(--text)";
}

/** 背景色: 日祝=赤系 / 土=青系 / 平日=面色。 */
export function dayBgColor(d: DayLike): string {
  if (d.isSunday || d.isHoliday) return "var(--sun-bg)";
  if (d.isSaturday) return "var(--sat-bg)";
  return "var(--surface)";
}
