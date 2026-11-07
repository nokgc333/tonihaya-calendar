import { describe, expect, test } from "vitest";
import { buildMonthDetail } from "./monthDetail";

const SETTINGS = { weekStart: "sun" as const };

describe("buildMonthDetail", () => {
  test("summary and holidays for May (2026)", () => {
    const detail = buildMonthDetail(2026, 5, null, SETTINGS);
    expect(detail.month.month).toBe(5);
    expect(detail.month.labelJa).toBe("5月");
    expect(detail.dayCount).toBe(31);
    expect(detail.holidays.every((h) => h.date.month === 5)).toBe(true);
    expect(detail.holidayCount).toBe(detail.holidays.length);
    expect(detail.holidayCount).toBeGreaterThan(0);
  });

  test("February (2026) has 28 days", () => {
    expect(buildMonthDetail(2026, 2, null, SETTINGS).dayCount).toBe(28);
  });

  test("business days in 2026-02 are the 18 weekdays left after removing weekday holidays", () => {
    expect(buildMonthDetail(2026, 2, null, SETTINGS).businessDayCount).toBe(18);
  });

  describe("remaining business days (from today onward)", () => {
    const TODAY = { year: 2026, month: 7, day: 4 };

    test("all business days remain in a future month", () => {
      const detail = buildMonthDetail(2027, 1, TODAY, SETTINGS);
      expect(detail.businessDaysRemaining).toBe(detail.businessDayCount);
    });

    test("no business days remain in a past month", () => {
      expect(
        buildMonthDetail(2025, 1, TODAY, SETTINGS).businessDaysRemaining,
      ).toBe(0);
    });

    test("all business days count as remaining when today is unknown", () => {
      const detail = buildMonthDetail(2026, 7, null, SETTINGS);
      expect(detail.businessDaysRemaining).toBe(detail.businessDayCount);
    });
  });
});
