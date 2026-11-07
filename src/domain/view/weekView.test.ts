import { describe, expect, test } from "vitest";
import { buildWeekView, minutesToOffset } from "./weekView";

const SETTINGS = { weekStart: "sun" as const };

describe("buildWeekView", () => {
  test("7 days starting on Sunday, with Sunday first", () => {
    const week = buildWeekView(
      { year: 2026, month: 7, day: 8 },
      null,
      SETTINGS,
    );
    expect(week.days).toHaveLength(7);
    expect(week.days[0]).toMatchObject({
      year: 2026,
      month: 7,
      day: 5,
      weekday: 0,
    });
    expect(week.days[6]).toMatchObject({ month: 7, day: 11, weekday: 6 });
  });

  test("a week spanning two months still has 7 days", () => {
    const week = buildWeekView(
      { year: 2026, month: 8, day: 1 },
      null,
      SETTINGS,
    );
    expect(week.days[0]).toMatchObject({ month: 7, day: 26 });
    expect(week.days[6]).toMatchObject({ month: 8, day: 1 });
  });

  test("today, holiday and weekend flags", () => {
    const week = buildWeekView(
      { year: 2026, month: 1, day: 1 },
      { year: 2026, month: 1, day: 1 },
      SETTINGS,
    );
    const jan1 = week.days.find((d) => d.month === 1 && d.day === 1)!;
    expect(jan1.isToday).toBe(true);
    expect(jan1.isHoliday).toBe(true);
    expect(jan1.holidayName).toBe("元日");
    const sun = week.days.find((d) => d.weekday === 0)!;
    expect(sun.isSunday).toBe(true);
    const sat = week.days.find((d) => d.weekday === 6)!;
    expect(sat.isSaturday).toBe(true);
  });

  test("starting on Monday puts Monday first", () => {
    const week = buildWeekView({ year: 2026, month: 7, day: 8 }, null, {
      weekStart: "mon",
    });
    expect(week.days[0].weekday).toBe(1);
    expect(week.days[6].weekday).toBe(0);
  });
});

describe("minutesToOffset", () => {
  test("0 minutes is 0px", () => {
    expect(minutesToOffset(0, 48)).toBe(0);
  });
  test("60 minutes is one hour", () => {
    expect(minutesToOffset(60, 48)).toBe(48);
  });
  test("90 minutes is 1.5 hours", () => {
    expect(minutesToOffset(90, 48)).toBe(72);
  });
});
