import { describe, it, expect } from "vitest";
import {
  defaultEventDate,
  neighborMonth,
  weekdayLabel,
} from "@/components/monthDetailModel";

describe("neighborMonth", () => {
  it("moves within the year", () => {
    expect(neighborMonth({ year: 2026, month: 7 }, -1)).toEqual({
      year: 2026,
      month: 6,
    });
    expect(neighborMonth({ year: 2026, month: 7 }, 1)).toEqual({
      year: 2026,
      month: 8,
    });
  });

  it("wraps from January back to December of the previous year", () => {
    expect(neighborMonth({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    });
  });

  it("wraps from December forward to January of the next year", () => {
    expect(neighborMonth({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
  });

  it("does not wrap in the opposite direction at the year edges", () => {
    expect(neighborMonth({ year: 2026, month: 1 }, 1)).toEqual({
      year: 2026,
      month: 2,
    });
    expect(neighborMonth({ year: 2026, month: 12 }, -1)).toEqual({
      year: 2026,
      month: 11,
    });
  });
});

describe("defaultEventDate", () => {
  it("uses today when it is inside the shown month", () => {
    const today = { year: 2026, month: 7, day: 15 };
    expect(defaultEventDate(today, { year: 2026, month: 7 })).toBe(today);
  });

  it("uses the first day when today is in another month or year", () => {
    const first = { year: 2026, month: 7, day: 1 };
    expect(
      defaultEventDate(
        { year: 2026, month: 6, day: 15 },
        { year: 2026, month: 7 },
      ),
    ).toEqual(first);
    expect(
      defaultEventDate(
        { year: 2025, month: 7, day: 15 },
        { year: 2026, month: 7 },
      ),
    ).toEqual(first);
    expect(defaultEventDate(null, { year: 2026, month: 7 })).toEqual(first);
  });
});

describe("weekdayLabel", () => {
  it("returns the weekday of the date", () => {
    expect(weekdayLabel({ year: 2026, month: 7, day: 20 })).toBe("月");
    expect(weekdayLabel({ year: 2026, month: 7, day: 19 })).toBe("日");
  });
});
