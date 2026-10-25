export type WeekStart = "sun" | "mon";

export interface CalendarDay {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: number;
  readonly inMonth: boolean;
}

export type CalendarWeek = readonly CalendarDay[];
