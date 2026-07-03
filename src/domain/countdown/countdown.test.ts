import { describe, expect, test } from "vitest";
import { getCountdowns } from "./countdown";

describe("getCountdowns", () => {
  test("2024-01-01(月): 各残日数", () => {
    const c = getCountdowns(2024, 1, 1);
    expect(c.toSaturday).toBe(5); // 月→土
    expect(c.toMonthEnd).toBe(30); // 1月は31日
    expect(c.toQuarterEnd).toBe(90); // 3/31まで（うるう年）
    expect(c.toYearEnd).toBe(365); // 12/31まで
  });

  test("2024-01-06(土): 土曜までは0", () => {
    expect(getCountdowns(2024, 1, 6).toSaturday).toBe(0);
  });

  test("2024-12-31: 月末・四半期末・年末は0", () => {
    const c = getCountdowns(2024, 12, 31);
    expect(c.toMonthEnd).toBe(0);
    expect(c.toQuarterEnd).toBe(0);
    expect(c.toYearEnd).toBe(0);
  });

  test("2024-05-10: 第2四半期末(6/30)までの残日数", () => {
    // 5/10 → 5/31(21) + 6/30(30) = 51
    expect(getCountdowns(2024, 5, 10).toQuarterEnd).toBe(51);
  });
});
