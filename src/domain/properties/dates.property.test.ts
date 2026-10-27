import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { daysInMonth, isLeapYear } from "@/domain/calendar";
import {
  daysInMonth as dateDaysInMonth,
  fromEpochDay,
  toEpochDay,
  weekdayOf,
} from "@/domain/shared/date";
import { addDays, diffDays } from "@/domain/timecalc";
import { anyDate, yearIn, ANY_YEARS } from "./arbitraries";

const THURSDAY = 4;
const mod7 = (n: number) => ((n % 7) + 7) % 7;

describe("days and dates", () => {
  it("turn a date into a day number and back without a change, for every year from 1 to 9999", () => {
    fc.assert(
      fc.property(anyDate, (d) => {
        expect(fromEpochDay(toEpochDay(d.year, d.month, d.day))).toEqual(d);
      }),
    );
  });

  it("number the next day with the next number", () => {
    fc.assert(
      fc.property(anyDate, (d) => {
        const next = fromEpochDay(toEpochDay(d.year, d.month, d.day) + 1);
        expect(diffDays(d, next)).toBe(1);
      }),
    );
  });

  it("move the weekday on by one each day, and agree with the day number", () => {
    fc.assert(
      fc.property(anyDate, (d) => {
        const epoch = toEpochDay(d.year, d.month, d.day);
        const next = fromEpochDay(epoch + 1);
        expect(weekdayOf(next.year, next.month, next.day)).toBe(
          (weekdayOf(d.year, d.month, d.day) + 1) % 7,
        );
        expect(weekdayOf(d.year, d.month, d.day)).toBe(mod7(epoch + THURSDAY));
      }),
    );
  });

  it("add and take away the same number of days to get the same date", () => {
    fc.assert(
      fc.property(anyDate, fc.integer({ min: -5000, max: 5000 }), (d, n) => {
        const moved = addDays(d, n);
        expect(diffDays(d, moved)).toBe(n);
        expect(addDays(moved, -n)).toEqual(d);
      }),
    );
  });

  it("put the first day of the next month right after the last day of this one", () => {
    fc.assert(
      fc.property(
        yearIn(ANY_YEARS),
        fc.integer({ min: 1, max: 12 }),
        (year, month) => {
          const last = toEpochDay(year, month, daysInMonth(year, month));
          const after = fromEpochDay(last + 1);
          expect(after.day).toBe(1);
          expect(after.month).toBe((month % 12) + 1);
        },
      ),
    );
  });

  it("agree on the length of every month between the two helpers", () => {
    fc.assert(
      fc.property(
        yearIn(ANY_YEARS),
        fc.integer({ min: 1, max: 12 }),
        (year, month) => {
          expect(dateDaysInMonth(year, month)).toBe(daysInMonth(year, month));
        },
      ),
    );
  });
});

describe("leap years", () => {
  it("follow the rule of four, one hundred and four hundred", () => {
    fc.assert(
      fc.property(yearIn(ANY_YEARS), (y) => {
        const expected = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
        expect(isLeapYear(y)).toBe(expected);
      }),
    );
  });

  it("give a year of 366 days when leap and 365 otherwise", () => {
    fc.assert(
      fc.property(yearIn(ANY_YEARS), (y) => {
        const total = Array.from({ length: 12 }, (_, i) =>
          daysInMonth(y, i + 1),
        ).reduce((a, b) => a + b, 0);
        expect(total).toBe(isLeapYear(y) ? 366 : 365);
        expect(toEpochDay(y + 1, 1, 1) - toEpochDay(y, 1, 1)).toBe(total);
      }),
    );
  });

  it("make February 29 a real date only in a leap year", () => {
    fc.assert(
      fc.property(yearIn(ANY_YEARS), (y) => {
        const { month } = fromEpochDay(toEpochDay(y, 2, 29));
        expect(month === 2).toBe(isLeapYear(y));
      }),
    );
  });
});
