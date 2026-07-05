import { describe, expect, test } from "vitest";
import { buildWeekView, minutesToOffset } from "./weekView";

const SETTINGS = { weekStart: "sun" as const };

describe("buildWeekView", () => {
  test("日曜開始で7日、先頭が日曜", () => {
    // 2026-07-08(水)を含む週 → 日曜=2026-07-05
    const week = buildWeekView(2026, 7, 8, null, SETTINGS);
    expect(week.days).toHaveLength(7);
    expect(week.days[0]).toMatchObject({ year: 2026, month: 7, day: 5, weekday: 0 });
    expect(week.days[6]).toMatchObject({ month: 7, day: 11, weekday: 6 });
  });

  test("月をまたぐ週も7日", () => {
    // 2026-08-01(土)を含む週 → 日曜=2026-07-26 〜 土曜=2026-08-01
    const week = buildWeekView(2026, 8, 1, null, SETTINGS);
    expect(week.days[0]).toMatchObject({ month: 7, day: 26 });
    expect(week.days[6]).toMatchObject({ month: 8, day: 1 });
  });

  test("today と祝日と土日フラグ", () => {
    const week = buildWeekView(2026, 1, 1, { year: 2026, month: 1, day: 1 }, SETTINGS);
    const jan1 = week.days.find((d) => d.month === 1 && d.day === 1)!;
    expect(jan1.isToday).toBe(true);
    expect(jan1.isHoliday).toBe(true);
    expect(jan1.holidayName).toBe("元日");
    const sun = week.days.find((d) => d.weekday === 0)!;
    expect(sun.isSunday).toBe(true);
    const sat = week.days.find((d) => d.weekday === 6)!;
    expect(sat.isSaturday).toBe(true);
  });

  test("月曜開始では先頭が月曜", () => {
    const week = buildWeekView(2026, 7, 8, null, { weekStart: "mon" });
    expect(week.days[0].weekday).toBe(1);
    expect(week.days[6].weekday).toBe(0);
  });
});

describe("minutesToOffset", () => {
  test("0分は0px", () => {
    expect(minutesToOffset(0, 48)).toBe(0);
  });
  test("60分は1時間分", () => {
    expect(minutesToOffset(60, 48)).toBe(48);
  });
  test("90分は1.5時間分", () => {
    expect(minutesToOffset(90, 48)).toBe(72);
  });
});
