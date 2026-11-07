import { describe, expect, it } from "vitest";

import { fromEpochDay, toEpochDay } from "../shared/date";
import { toKyureki } from "./index";
import { KYUREKI_FIRST_YEAR, KYUREKI_ROWS } from "./table";

describe("toKyureki", () => {
  it.each([
    [2017, 1, 28],
    [2018, 2, 16],
    [2019, 2, 5],
    [2020, 1, 25],
    [2021, 2, 12],
    [2022, 2, 1],
    [2023, 1, 22],
    [2024, 2, 10],
    [2025, 1, 29],
    [2026, 2, 17],
    [2027, 2, 7],
    [2028, 1, 27],
    [2029, 2, 13],
    [2030, 2, 3],
    [1950, 2, 17],
    [2000, 2, 5],
  ])("starts lunar year %i on %i/%i", (year, month, day) => {
    expect(toKyureki(year, month, day)).toEqual({
      year,
      month: 1,
      day: 1,
      leap: false,
    });
    const previous = fromEpochDay(toEpochDay(year, month, day) - 1);
    const eve = toKyureki(previous.year, previous.month, previous.day)!;
    expect(eve).toEqual({
      year: year - 1,
      month: 12,
      day: expect.any(Number),
      leap: false,
    });
    expect([29, 30]).toContain(eve.day);
  });

  it.each([
    [2020, 5, 23, 4],
    [2023, 3, 22, 2],
    [2025, 7, 25, 6],
    [2028, 6, 23, 5],
    [2031, 4, 22, 3],
  ])(
    "repeats the leap month in %i on %i/%i",
    (year, month, day, lunarMonth) => {
      expect(toKyureki(year, month, day)).toEqual({
        year,
        month: lunarMonth,
        day: 1,
        leap: true,
      });
      const previous = fromEpochDay(toEpochDay(year, month, day) - 1);
      const twin = toKyureki(previous.year, previous.month, previous.day)!;
      expect(twin.month).toBe(lunarMonth);
      expect(twin.leap).toBe(false);
      expect([29, 30]).toContain(twin.day);
    },
  );

  it("converts the supported boundaries and rejects days outside them", () => {
    expect(toKyureki(1950, 1, 1)?.year).toBe(1949);
    expect(toKyureki(2150, 12, 31)).not.toBeNull();
    expect(toKyureki(1949, 12, 31)).toBeNull();
    expect(toKyureki(2151, 1, 1)).toBeNull();
  });

  it("uses the JST civil day when a new moon is late at night in China", () => {
    // The new moon at 1950-03-18 23:20 UTC+8 falls on March 19 in JST.
    expect(toKyureki(1950, 3, 18)).toEqual({
      year: 1950,
      month: 1,
      day: 30,
      leap: false,
    });
    expect(toKyureki(1950, 3, 19)).toEqual({
      year: 1950,
      month: 2,
      day: 1,
      leap: false,
    });
  });

  it("assigns leap month eleven in 2033 using the winter solstice rule", () => {
    expect(toKyureki(2033, 12, 22)).toEqual({
      year: 2033,
      month: 11,
      day: 1,
      leap: true,
    });
  });

  it("advances continuously through every supported day", () => {
    const start = toEpochDay(1950, 1, 1);
    const end = toEpochDay(2150, 12, 31);
    let previous = toKyureki(1950, 1, 1)!;
    const monthCounts = new Map<number, { months: number; leaps: number }>();
    for (let epoch = start + 1; epoch <= end; epoch += 1) {
      const date = fromEpochDay(epoch);
      const current = toKyureki(date.year, date.month, date.day)!;
      expect(current).not.toBeNull();
      expect(current.month).toBeGreaterThanOrEqual(1);
      expect(current.month).toBeLessThanOrEqual(12);
      if (current.day !== 1) {
        expect(current).toEqual({ ...previous, day: previous.day + 1 });
      } else {
        expect([29, 30]).toContain(previous.day);
        expect(current.month).toBe(
          current.leap ? previous.month : (previous.month % 12) + 1,
        );
        expect(current.year).toBe(
          previous.year + (current.month === 1 && !current.leap ? 1 : 0),
        );
        expect(current.leap && previous.leap).toBe(false);
        const counts = monthCounts.get(current.year) ?? { months: 0, leaps: 0 };
        counts.months += 1;
        counts.leaps += Number(current.leap);
        expect(counts.leaps).toBeLessThanOrEqual(1);
        expect(counts.months).toBeLessThanOrEqual(13);
        monthCounts.set(current.year, counts);
      }
      previous = current;
    }
    for (const [year, counts] of monthCounts) {
      const leapMonth = KYUREKI_ROWS[year - KYUREKI_FIRST_YEAR][1];
      if (year >= 1950 && year < 2150) {
        expect(counts).toEqual({
          months: leapMonth === 0 ? 12 : 13,
          leaps: Number(leapMonth !== 0),
        });
      }
      if (counts.months === 13) {
        expect(KYUREKI_ROWS[year - KYUREKI_FIRST_YEAR + 1]?.[1]).toBe(0);
      }
    }
  });
});
