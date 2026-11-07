export const MIN_YEAR = 1950;
export const MAX_YEAR = 2150;

export function clampYear(year: number): number {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));
}

export function resolveYearInput(raw: string, fallback: number): number {
  const parsed = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(parsed)) {
    return fallback;
  }
  return clampYear(Math.trunc(parsed));
}
