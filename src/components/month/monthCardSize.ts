export type MonthCardSize = "sm" | "lg";

export const SIZE = {
  sm: {
    row: "1.5rem",
    dayText: "text-[11px]",
    circle: "h-6 w-6",
    weekday: "text-[10px]",
  },
  lg: {
    row: "7.59375rem",
    dayText: "text-base",
    circle: "h-9 w-9",
    weekday: "text-xs",
  },
} as const;
