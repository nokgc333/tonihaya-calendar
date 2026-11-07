import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { getMonthGrid } from "@/domain/calendar";
import { daysInMonth } from "@/domain/calendar";
import { toEpochDay, weekdayOf } from "@/domain/shared/date";
import { buildMonthView, buildWeekView } from "@/domain/view";
import { APP_YEARS, appDate, weekStart, yearIn } from "./arbitraries";

const SUNDAY = 0;
const SATURDAY = 6;
const epochOf = (d: { year: number; month: number; day: number }) =>
  toEpochDay(d.year, d.month, d.day);

describe("the month grid", () => {
  const month = fc.integer({ min: 1, max: 12 });

  it("always has six weeks of seven consecutive days", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const days = getMonthGrid(year, m, start).flat();
        expect(getMonthGrid(year, m, start)).toHaveLength(6);
        expect(days).toHaveLength(42);
        for (let i = 1; i < days.length; i += 1) {
          expect(epochOf(days[i]) - epochOf(days[i - 1])).toBe(1);
        }
      }),
    );
  });

  it("holds every day of the month once, as the days that are in the month", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const inside = getMonthGrid(year, m, start)
          .flat()
          .filter((d) => d.inMonth);
        expect(inside.map((d) => d.day)).toEqual(
          Array.from({ length: daysInMonth(year, m) }, (_, i) => i + 1),
        );
      }),
    );
  });

  it("starts each week on the chosen weekday, and carries the right weekday on every day", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const weeks = getMonthGrid(year, m, start);
        for (const week of weeks) {
          expect(week[0].weekday).toBe(start === "sun" ? SUNDAY : 1);
          for (const d of week)
            expect(d.weekday).toBe(weekdayOf(d.year, d.month, d.day));
        }
      }),
    );
  });

  it("begins with the week that holds the first of the month", () => {
    fc.assert(
      fc.property(yearIn(APP_YEARS), month, weekStart, (year, m, start) => {
        const first = getMonthGrid(year, m, start)
          .flat()
          .findIndex((d) => d.inMonth);
        expect(first).toBeLessThan(7);
      }),
    );
  });

  it("marks exactly one day as today when today is in the month and none otherwise", () => {
    fc.assert(
      fc.property(
        appDate,
        weekStart,
        fc.integer({ min: 1, max: 12 }),
        (today, start, m) => {
          const view = buildMonthView(today.year, m, today, start);
          const marked = view.weeks.flat().filter((c) => c.isToday);
          expect(marked).toHaveLength(m === today.month ? 1 : 0);
          if (marked.length === 1) {
            expect(marked[0].day).toBe(today.day);
            expect(marked[0].inMonth).toBe(true);
          }
        },
      ),
    );
  });
});

describe("the week view", () => {
  it("has seven consecutive days that include the day it was opened on", () => {
    fc.assert(
      fc.property(appDate, weekStart, (ref, start) => {
        const { days } = buildWeekView(ref, null, { weekStart: start });
        expect(days).toHaveLength(7);
        for (let i = 1; i < 7; i += 1)
          expect(epochOf(days[i]) - epochOf(days[i - 1])).toBe(1);
        expect(days.some((d) => epochOf(d) === epochOf(ref))).toBe(true);
        expect(days[0].weekday).toBe(start === "sun" ? SUNDAY : 1);
      }),
    );
  });

  it("flags Saturday, Sunday and today on the right days only", () => {
    fc.assert(
      fc.property(appDate, (ref) => {
        const { days } = buildWeekView(ref, ref, { weekStart: "sun" });
        for (const d of days) {
          expect(d.isSunday).toBe(d.weekday === SUNDAY);
          expect(d.isSaturday).toBe(d.weekday === SATURDAY);
          expect(d.isToday).toBe(epochOf(d) === epochOf(ref));
        }
      }),
    );
  });
});
