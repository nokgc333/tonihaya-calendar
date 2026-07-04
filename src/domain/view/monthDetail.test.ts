import { describe, expect, test } from "vitest";
import { buildMonthDetail } from "./monthDetail";

const SETTINGS = { weekStart: "sun" as const };

describe("buildMonthDetail", () => {
  test("5月(2026)のサマリと祝日", () => {
    const detail = buildMonthDetail(2026, 5, null, SETTINGS);
    expect(detail.month.month).toBe(5);
    expect(detail.month.labelJa).toBe("5月");
    expect(detail.dayCount).toBe(31);
    expect(detail.holidays.every((h) => h.date.month === 5)).toBe(true);
    expect(detail.holidayCount).toBe(detail.holidays.length);
    expect(detail.holidayCount).toBeGreaterThan(0);
  });

  test("2月(2026)は28日", () => {
    expect(buildMonthDetail(2026, 2, null, SETTINGS).dayCount).toBe(28);
  });

  test("営業日数(2026-02)は平日から平日祝日を除いた18日", () => {
    // 2026-02: 平日20日、平日祝日は 2/11(水)建国・2/23(月)天皇誕生日 の2日 → 18
    expect(buildMonthDetail(2026, 2, null, SETTINGS).businessDayCount).toBe(18);
  });

  describe("営業日残（本日以降の残り営業日）", () => {
    const TODAY = { year: 2026, month: 7, day: 4 };

    test("未来の月は全営業日が残っている", () => {
      const detail = buildMonthDetail(2027, 1, TODAY, SETTINGS);
      expect(detail.businessDaysRemaining).toBe(detail.businessDayCount);
    });

    test("過去の月は残り0", () => {
      expect(buildMonthDetail(2025, 1, TODAY, SETTINGS).businessDaysRemaining).toBe(0);
    });

    test("本日不明時は全営業日を残とみなす", () => {
      const detail = buildMonthDetail(2026, 7, null, SETTINGS);
      expect(detail.businessDaysRemaining).toBe(detail.businessDayCount);
    });
  });
});
