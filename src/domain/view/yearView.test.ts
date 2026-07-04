import { describe, expect, test } from "vitest";
import { buildYearView } from "./yearView";

const DEFAULT_SETTINGS = { weekStart: "sun" as const };

describe("buildYearView", () => {
  test("12ヶ月分を返す", () => {
    const view = buildYearView(2024, null, DEFAULT_SETTINGS);
    expect(view.year).toBe(2024);
    expect(view.months).toHaveLength(12);
  });

  test("月ラベル（数字・英語・和風）が正しい", () => {
    const jan = buildYearView(2024, null, DEFAULT_SETTINGS).months[0];
    expect(jan.labelJa).toBe("1月");
    expect(jan.labelEn).toBe("January");
    expect(jan.labelWafu).toBe("睦月");
    const dec = buildYearView(2024, null, DEFAULT_SETTINGS).months[11];
    expect(dec.labelWafu).toBe("師走");
  });

  test("元日(2024-01-01)は祝日フラグ付き", () => {
    const jan = buildYearView(2024, null, DEFAULT_SETTINGS).months[0];
    const cell = jan.weeks.flat().find((c) => c.inMonth && c.day === 1)!;
    expect(cell.isHoliday).toBe(true);
    expect(cell.holidayName).toBe("元日");
    expect(cell.isSunday).toBe(false);
  });

  test("本日フラグは today 指定日にのみ立つ", () => {
    const view = buildYearView(2024, { year: 2024, month: 7, day: 4 }, DEFAULT_SETTINGS);
    const jul = view.months[6];
    const today = jul.weeks.flat().find((c) => c.inMonth && c.day === 4)!;
    expect(today.isToday).toBe(true);
    const other = jul.weeks.flat().find((c) => c.inMonth && c.day === 5)!;
    expect(other.isToday).toBe(false);
  });

  test("本日フラグは年間で1セルのみ（隣月のパディング日には立たない）", () => {
    // 2026-07-04 は6月カードの翌月パディングにも現れるが、本日は在月セルのみ
    const view = buildYearView(2026, { year: 2026, month: 7, day: 4 }, DEFAULT_SETTINGS);
    const todayCells = view.months
      .flatMap((m) => m.weeks.flat())
      .filter((c) => c.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].inMonth).toBe(true);
  });

  test("土日フラグ（2024-01-06 土 / 2024-01-07 日）", () => {
    const jan = buildYearView(2024, null, DEFAULT_SETTINGS).months[0];
    const sat = jan.weeks.flat().find((c) => c.inMonth && c.day === 6)!;
    const sun = jan.weeks.flat().find((c) => c.inMonth && c.day === 7)!;
    expect(sat.isSaturday).toBe(true);
    expect(sun.isSunday).toBe(true);
  });

  test("today がその年に属するとき countdowns を含む", () => {
    const view = buildYearView(2024, { year: 2024, month: 7, day: 4 }, DEFAULT_SETTINGS);
    expect(view.countdowns).not.toBeNull();
    const otherYear = buildYearView(2025, { year: 2024, month: 7, day: 4 }, DEFAULT_SETTINGS);
    expect(otherYear.countdowns).toBeNull();
  });
});
