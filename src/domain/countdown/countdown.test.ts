import { describe, expect, test } from "vitest";
import { getCountdowns } from "./countdown";

describe("getCountdowns", () => {
  test("2024-01-01 (Mon): each countdown value", () => {
    const c = getCountdowns(2024, 1, 1);
    expect(c.toSaturday).toBe(5);
    expect(c.toMonthEnd).toBe(30);
    expect(c.remainingBusinessDays).toBe(21);
    expect(c.toYearEnd).toBe(365);
  });

  test("2024-01-06 (Sat): days until Saturday is 0", () => {
    expect(getCountdowns(2024, 1, 6).toSaturday).toBe(0);
  });

  test("2024-12-31: month end, remaining business days and year end are 0", () => {
    const c = getCountdowns(2024, 12, 31);
    expect(c.toMonthEnd).toBe(0);
    expect(c.remainingBusinessDays).toBe(0);
    expect(c.toYearEnd).toBe(0);
  });

  test("2024-05-01: remaining business days excluding the Golden Week holidays (including substitutes)", () => {
    expect(getCountdowns(2024, 5, 1).remainingBusinessDays).toBe(20);
  });
});
