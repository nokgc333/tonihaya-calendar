import fc from "fast-check";
import { daysInMonth } from "@/domain/calendar";
import type { CivilDate } from "@/domain/shared/date";

export const APP_YEARS = { min: 1950, max: 2150 } as const;
export const ANY_YEARS = { min: 1, max: 9999 } as const;

export const yearIn = (range: { min: number; max: number }) =>
  fc.integer(range);

export const civilDateIn = (range: { min: number; max: number }) =>
  fc
    .tuple(yearIn(range), fc.integer({ min: 1, max: 12 }))
    .chain(([year, month]) =>
      fc
        .integer({ min: 1, max: daysInMonth(year, month) })
        .map((day): CivilDate => ({ year, month, day })),
    );

export const appDate = civilDateIn(APP_YEARS);
export const anyDate = civilDateIn(ANY_YEARS);

export const timeOfDay = fc.record({
  hour: fc.integer({ min: 0, max: 23 }),
  minute: fc.integer({ min: 0, max: 59 }),
});

export const weekStart = fc.constantFrom("sun", "mon" as const);
