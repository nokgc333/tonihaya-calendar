import { describe, expect, test } from "vitest";
import {
  addDays,
  addDurationToTime,
  addDurations,
  diffDays,
  diffTime,
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
      diffDays({ year: 2024, month: 1, day: 1 }, { year: 2024, month: 12, day: 31 }),
    ).toBe(365);
  });

  test("reverse order gives a negative value", () => {
    expect(
      diffDays({ year: 2024, month: 12, day: 31 }, { year: 2024, month: 1, day: 1 }),
    ).toBe(-365);
  });
});

describe("addDurations (4: adding and subtracting durations)", () => {
  test("1:20 + 2:50 = 4:10", () => {
    expect(addDurations({ hours: 1, minutes: 20 }, { hours: 2, minutes: 50 })).toEqual({
      hours: 4,
      minutes: 10,
    });
  });

  test("handles pure durations over 24 hours (20:00 + 10:00 = 30:00)", () => {
    expect(addDurations({ hours: 20, minutes: 0 }, { hours: 10, minutes: 0 })).toEqual({
      hours: 30,
      minutes: 0,
    });
  });
});
