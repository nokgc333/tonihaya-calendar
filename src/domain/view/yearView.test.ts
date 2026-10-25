import { describe, expect, test } from "vitest";
import { buildYearView } from "./yearView";

const DEFAULT_SETTINGS = { weekStart: "sun" as const };

describe("buildYearView", () => {
  test("returns 12 months", () => {
    const view = buildYearView(2024, null, DEFAULT_SETTINGS);
    expect(view.year).toBe(2024);
    expect(view.months).toHaveLength(12);
  });

  test("month labels (number, English, Japanese) are correct", () => {
    const jan = buildYearView(2024, null, DEFAULT_SETTINGS).months[0];
    expect(jan.labelJa).toBe("1月");
    expect(jan.labelEn).toBe("January");
    expect(jan.labelWafu).toBe("睦月");
    const dec = buildYearView(2024, null, DEFAULT_SETTINGS).months[11];
    expect(dec.labelWafu).toBe("師走");
  });

  test("New Year's Day (2024-01-01) has the holiday flag", () => {
    const jan = buildYearView(2024, null, DEFAULT_SETTINGS).months[0];
    const cell = jan.weeks.flat().find((c) => c.inMonth && c.day === 1)!;
    expect(cell.isHoliday).toBe(true);
    expect(cell.holidayName).toBe("元日");
    expect(cell.isSunday).toBe(false);
  });

  test("the today flag is set only on the given today", () => {
    const view = buildYearView(2024, { year: 2024, month: 7, day: 4 }, DEFAULT_SETTINGS);
    const jul = view.months[6];
    const today = jul.weeks.flat().find((c) => c.inMonth && c.day === 4)!;
    expect(today.isToday).toBe(true);
    const other = jul.weeks.flat().find((c) => c.inMonth && c.day === 5)!;
    expect(other.isToday).toBe(false);
  });

  test("the today flag is set on exactly one cell in the year (not on adjacent-month padding days)", () => {
    const view = buildYearView(2026, { year: 2026, month: 7, day: 4 }, DEFAULT_SETTINGS);
    const todayCells = view.months
      .flatMap((m) => m.weeks.flat())
      .filter((c) => c.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].inMonth).toBe(true);
  });

  test("weekend flags (2024-01-06 Sat / 2024-01-07 Sun)", () => {
    const jan = buildYearView(2024, null, DEFAULT_SETTINGS).months[0];
    const sat = jan.weeks.flat().find((c) => c.inMonth && c.day === 6)!;
    const sun = jan.weeks.flat().find((c) => c.inMonth && c.day === 7)!;
    expect(sat.isSaturday).toBe(true);
    expect(sun.isSunday).toBe(true);
  });

  test("includes countdowns regardless of the displayed year when today is known (today-based, always shown)", () => {
    const sameYear = buildYearView(2024, { year: 2024, month: 7, day: 4 }, DEFAULT_SETTINGS);
    const otherYear = buildYearView(2025, { year: 2024, month: 7, day: 4 }, DEFAULT_SETTINGS);
    expect(sameYear.countdowns).not.toBeNull();
    expect(otherYear.countdowns).not.toBeNull();
    expect(otherYear.countdowns).toEqual(sameYear.countdowns);
  });

  test("countdowns is null when today is null", () => {
    expect(buildYearView(2024, null, DEFAULT_SETTINGS).countdowns).toBeNull();
  });
});
