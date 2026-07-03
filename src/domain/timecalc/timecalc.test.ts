import { describe, expect, test } from "vitest";
import {
  addDays,
  addDurationToTime,
  addDurations,
  diffDays,
  diffTime,
} from "./timecalc";

describe("addDurationToTime（①時刻±時間）", () => {
  test("14:30 + 45分 = 15:15（日跨ぎなし）", () => {
    expect(addDurationToTime({ hour: 14, minute: 30 }, 45)).toEqual({
      time: { hour: 15, minute: 15 },
      dayOffset: 0,
    });
  });

  test("23:30 + 45分 = 翌0:15（+1日）", () => {
    expect(addDurationToTime({ hour: 23, minute: 30 }, 45)).toEqual({
      time: { hour: 0, minute: 15 },
      dayOffset: 1,
    });
  });

  test("0:15 − 30分 = 前日23:45（−1日）", () => {
    expect(addDurationToTime({ hour: 0, minute: 15 }, -30)).toEqual({
      time: { hour: 23, minute: 45 },
      dayOffset: -1,
    });
  });
});

describe("diffTime（②時刻間の差分）", () => {
  test("9:00〜17:30 = 8時間30分", () => {
    expect(diffTime({ hour: 9, minute: 0 }, { hour: 17, minute: 30 })).toEqual({
      hours: 8,
      minutes: 30,
    });
  });

  test("23:00〜1:00 = 2時間（翌日跨ぎ）", () => {
    expect(diffTime({ hour: 23, minute: 0 }, { hour: 1, minute: 0 })).toEqual({
      hours: 2,
      minutes: 0,
    });
  });
});

describe("addDays / diffDays（③日付±日数・差分）", () => {
  test("2024-02-28 + 1日 = 2024-02-29（うるう年）", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  test("2024-02-28 + 2日 = 2024-03-01", () => {
    expect(addDays({ year: 2024, month: 2, day: 28 }, 2)).toEqual({
      year: 2024,
      month: 3,
      day: 1,
    });
  });

  test("2024-01-01 〜 2024-12-31 = 365日", () => {
    expect(
      diffDays({ year: 2024, month: 1, day: 1 }, { year: 2024, month: 12, day: 31 }),
    ).toBe(365);
  });

  test("逆順は負の値", () => {
    expect(
      diffDays({ year: 2024, month: 12, day: 31 }, { year: 2024, month: 1, day: 1 }),
    ).toBe(-365);
  });
});

describe("addDurations（④時間の加減算）", () => {
  test("1:20 + 2:50 = 4:10", () => {
    expect(addDurations({ hours: 1, minutes: 20 }, { hours: 2, minutes: 50 })).toEqual({
      hours: 4,
      minutes: 10,
    });
  });

  test("24時間を超える純粋な時間量を扱える（20:00 + 10:00 = 30:00）", () => {
    expect(addDurations({ hours: 20, minutes: 0 }, { hours: 10, minutes: 0 })).toEqual({
      hours: 30,
      minutes: 0,
    });
  });
});
