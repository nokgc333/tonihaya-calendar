import { describe, expect, test } from "vitest";
import {
  addDays,
  addDurationToTime,
  addDurations,
  diffDays,
  diffTime,
  subtractDurations,
} from "./timecalc";

describe("addDurationToTime (1: time ± duration)", () => {
  test("14:30 + 45 min = 15:15 (no day crossing)", () => {
    expect(addDurationToTime({ hour: 14, minute: 30 }, 45)).toEqual({
      time: { hour: 15, minute: 15 },
      dayOffset: 0,
    });
  });

  test("23:30 + 45 min = 0:15 next day (+1 day)", () => {
    expect(addDurationToTime({ hour: 23, minute: 30 }, 45)).toEqual({
      time: { hour: 0, minute: 15 },
      dayOffset: 1,
    });
  });

  test("0:15 - 30 min = 23:45 previous day (-1 day)", () => {
    expect(addDurationToTime({ hour: 0, minute: 15 }, -30)).toEqual({
      time: { hour: 23, minute: 45 },
      dayOffset: -1,
    });
  });
});

describe("diffTime (2: difference between times)", () => {
  test("9:00 to 17:30 = 8 h 30 min", () => {
    expect(diffTime({ hour: 9, minute: 0 }, { hour: 17, minute: 30 })).toEqual({
      hours: 8,
      minutes: 30,
    });
  });

  test("23:00 to 1:00 = 2 h (crosses midnight)", () => {
    expect(diffTime({ hour: 23, minute: 0 }, { hour: 1, minute: 0 })).toEqual({
      hours: 2,
      minutes: 0,
    });
  });
});

describe("addDays / diffDays (3: date ± days and difference)", () => {
  test("2024-02-28 + 1 day = 2024-02-29 (leap year)", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  test("2024-02-28 + 2 days = 2024-03-01", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 2)).toEqual({
      year: 2024,
      month: 3,
      day: 1,
    });
  });

  test("2024-01-01 to 2024-12-31 = 365 days", () => {
    expect(
      diffDays(
        { year: 2024, month: 1, day: 1 },
        { year: 2024, month: 12, day: 31 },
      ),
    ).toBe(365);
  });

  test("reverse order gives a negative value", () => {
    expect(
      diffDays(
        { year: 2024, month: 12, day: 31 },
        { year: 2024, month: 1, day: 1 },
      ),
    ).toBe(-365);
  });
});

describe("addDurations (4: adding and subtracting durations)", () => {
  test("1:20 + 2:50 = 4:10", () => {
    expect(
      addDurations({ hours: 1, minutes: 20 }, { hours: 2, minutes: 50 }),
    ).toEqual({
      hours: 4,
      minutes: 10,
    });
  });

  test("handles pure durations over 24 hours (20:00 + 10:00 = 30:00)", () => {
    expect(
      addDurations({ hours: 20, minutes: 0 }, { hours: 10, minutes: 0 }),
    ).toEqual({
      hours: 30,
      minutes: 0,
    });
  });
});

describe("subtractDurations (4: subtracting durations)", () => {
  test("4:10 - 2:50 = 1:20", () => {
    expect(
      subtractDurations({ hours: 4, minutes: 10 }, { hours: 2, minutes: 50 }),
    ).toEqual({ hours: 1, minutes: 20, negative: false });
  });

  test("1:20 - 2:50 = -1:30 (the result is negative)", () => {
    expect(
      subtractDurations({ hours: 1, minutes: 20 }, { hours: 2, minutes: 50 }),
    ).toEqual({ hours: 1, minutes: 30, negative: true });
  });

  test("equal durations give zero, which is not negative", () => {
    expect(
      subtractDurations({ hours: 2, minutes: 0 }, { hours: 2, minutes: 0 }),
    ).toEqual({ hours: 0, minutes: 0, negative: false });
  });
});

describe("the boundaries of the calendar", () => {
  const date = (year: number, month: number, day: number) => ({
    year,
    month,
    day,
  });

  test.each([
    [date(2023, 2, 28), 1, date(2023, 3, 1)],
    [date(2024, 2, 29), 1, date(2024, 3, 1)],
    [date(2024, 12, 31), 1, date(2025, 1, 1)],
    [date(2025, 1, 1), -1, date(2024, 12, 31)],
    [date(2024, 3, 1), -1, date(2024, 2, 29)],
    [date(2023, 3, 1), -1, date(2023, 2, 28)],
    [date(2026, 1, 31), 30, date(2026, 3, 2)],
  ])("%j + %i days = %j", (from, days, expected) => {
    expect(addDays(from, days)).toEqual(expected);
  });

  test.each([
    [date(2024, 2, 28), date(2024, 3, 1), 2],
    [date(2023, 2, 28), date(2023, 3, 1), 1],
    [date(2023, 12, 31), date(2024, 1, 1), 1],
    [date(2026, 7, 4), date(2026, 12, 31), 180],
    [date(2026, 7, 4), date(2026, 7, 4), 0],
  ])("%j to %j = %i days", (from, to, expected) => {
    expect(diffDays(from, to)).toBe(expected);
  });

  test("a time difference of zero is zero, not 24 hours", () => {
    expect(diffTime({ hour: 9, minute: 0 }, { hour: 9, minute: 0 })).toEqual({
      hours: 0,
      minutes: 0,
    });
  });

  test("adding a whole day or more to a time moves only the day offset", () => {
    expect(addDurationToTime({ hour: 14, minute: 30 }, 1440 + 45)).toEqual({
      time: { hour: 15, minute: 15 },
      dayOffset: 1,
    });
    expect(addDurationToTime({ hour: 0, minute: 0 }, -2880)).toEqual({
      time: { hour: 0, minute: 0 },
      dayOffset: -2,
    });
  });
});
