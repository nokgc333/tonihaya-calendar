import { describe, expect, test } from "vitest";
import { buildDayView } from "./dayView";

describe("buildDayView", () => {
  test("平日: フラグはすべて false、today 一致", () => {
    // 2026-07-08 は水曜
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

  test("日曜フラグ", () => {
    // 2026-07-05 は日曜
    const model = buildDayView(2026, 7, 5, null);
    expect(model.day.weekday).toBe(0);
    expect(model.day.isSunday).toBe(true);
    expect(model.day.isSaturday).toBe(false);
  });

  test("土曜フラグ", () => {
    // 2026-07-11 は土曜
    const model = buildDayView(2026, 7, 11, null);
    expect(model.day.weekday).toBe(6);
    expect(model.day.isSaturday).toBe(true);
  });

  test("祝日: 名前と isHoliday", () => {
    const model = buildDayView(2026, 1, 1, null);
    expect(model.day.isHoliday).toBe(true);
    expect(model.day.holidayName).toBe("元日");
  });

  test("today 不一致 / null で isToday false", () => {
    expect(buildDayView(2026, 7, 8, { year: 2026, month: 7, day: 9 }).day.isToday).toBe(false);
    expect(buildDayView(2026, 7, 8, null).day.isToday).toBe(false);
  });
});
