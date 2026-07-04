/** 対応年の下限（要件定義書§8: 全要素が正確な範囲の下端） */
export const MIN_YEAR = 1950;
/** 対応年の上限（春分/秋分近似式の実用上端） */
export const MAX_YEAR = 2150;

/** 年を対応範囲にクランプ */
export function clampYear(year: number): number {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));
}

/** 入力文字列を確定時に年へ解決（無効なら fallback、範囲外はクランプ、小数は切り捨て） */
export function resolveYearInput(raw: string, fallback: number): number {
  const parsed = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(parsed)) {
    return fallback;
  }
  return clampYear(Math.trunc(parsed));
}
