import { describe, expect, test } from "vitest";
import { getCountdowns } from "./countdown";

describe("getCountdowns", () => {
  test("2024-01-01(月): 各残日数", () => {
    const c = getCountdowns(2024, 1, 1);
    expect(c.toSaturday).toBe(5); // 月→土
    expect(c.toMonthEnd).toBe(30); // 1月は31日
    expect(c.remainingBusinessDays).toBe(21); // 1/2〜1/31の平日から成人の日(1/8)を除外
    expect(c.toYearEnd).toBe(365); // 12/31まで
  });

  test("2024-01-06(土): 土曜までは0", () => {
    expect(getCountdowns(2024, 1, 6).toSaturday).toBe(0);
  });

  test("2024-12-31: 月末・残り営業日・年末は0", () => {
    const c = getCountdowns(2024, 12, 31);
    expect(c.toMonthEnd).toBe(0);
    expect(c.remainingBusinessDays).toBe(0); // 翌日以降なし
    expect(c.toYearEnd).toBe(0);
  });

  test("2024-05-01: GWの祝日(振替含む)を除外した残り営業日", () => {
    // 5/2〜5/31の平日から 憲法記念日・みどりの日・こどもの日・振替(5/6) を除外
    expect(getCountdowns(2024, 5, 1).remainingBusinessDays).toBe(20);
  });
});
