interface DayLike {
  readonly isSunday: boolean;
  readonly isSaturday: boolean;
  readonly isHoliday: boolean;
}

export function dayTextColor(d: DayLike): string {
  if (d.isHoliday) return "var(--holiday-text)";
  if (d.isSunday) return "var(--accent-red)";
  if (d.isSaturday) return "var(--accent-sat)";
  return "var(--text)";
}

export function dayBgColor(d: DayLike): string {
  if (d.isSunday) return "var(--sun-bg)";
  if (d.isSaturday) return "var(--sat-bg)";
  return "var(--surface)";
}
