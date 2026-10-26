import { describe, expect, test } from "vitest";
import { buildDayView } from "./dayView";

describe("buildDayView", () => {
  test("weekday: all flags false, today matches", () => {
    const model = buildDayView(2026, 7, 8, { year: 2026, month: 7, day: 8 });
    expect(model.day).toMatchObject({
      year: 2026,
      month: 7,
      day: 8,
      weekday: 3,
      isToday: true,
      isHoliday: false,
      isSaturday: false,
      isSunday: false,
    });
    expect(model.day.holidayName).toBeUndefined();
  });

  test("Sunday flag", () => {
    const model = buildDayView(2026, 7, 5, null);
    expect(model.day.weekday).toBe(0);
    expect(model.day.isSunday).toBe(true);
    expect(model.day.isSaturday).toBe(false);
  });

  test("Saturday flag", () => {
    const model = buildDayView(2026, 7, 11, null);
    expect(model.day.weekday).toBe(6);
    expect(model.day.isSaturday).toBe(true);
  });

  test("holiday: name and isHoliday", () => {
    const model = buildDayView(2026, 1, 1, null);
    expect(model.day.isHoliday).toBe(true);
    expect(model.day.holidayName).toBe("元日");
  });

  test("isToday is false when today differs or is null", () => {
    expect(
      buildDayView(2026, 7, 8, { year: 2026, month: 7, day: 9 }).day.isToday,
    ).toBe(false);
    expect(buildDayView(2026, 7, 8, null).day.isToday).toBe(false);
  });

  test("holiday on a weekend: both flags are set", () => {
    const model = buildDayView(2026, 5, 3, null);
    expect(model.day.isHoliday).toBe(true);
    expect(model.day.isSunday || model.day.isSaturday).toBe(true);
  });
});
