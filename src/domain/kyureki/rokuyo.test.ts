import { describe, expect, it } from "vitest";

import { fromEpochDay, toEpochDay } from "../shared/date";
import { rokuyoOf, toKyureki } from "./index";

describe("rokuyoOf", () => {
  it.each([
    [2020, 1, 25],
    [2025, 1, 29],
    [2026, 2, 17],
  ])("gives senshō on the lunar new year %i/%i/%i", (year, month, day) => {
    expect(rokuyoOf(year, month, day)).toBe("先勝");
  });

  it("cycles through the six days in order, starting again on the first of each lunar month", () => {
    const order = ["先勝", "友引", "先負", "仏滅", "大安", "赤口"];
    const start = toEpochDay(2026, 2, 17);
    const seen = Array.from({ length: 6 }, (_, i) => {
      const d = fromEpochDay(start + i);
      return rokuyoOf(d.year, d.month, d.day);
    });
    expect(seen).toEqual(order);
  });

  it("starts the first of each lunar month with the day that the month number decides", () => {
    const names = ["大安", "赤口", "先勝", "友引", "先負", "仏滅"];
    const first = new Map<number, string>();
    for (
      let epoch = toEpochDay(2026, 2, 17);
      epoch < toEpochDay(2027, 2, 6);
      epoch += 1
    ) {
      const d = fromEpochDay(epoch);
      const lunar = toKyureki(d.year, d.month, d.day)!;
      if (lunar.day === 1)
        first.set(
          lunar.month * 2 + Number(lunar.leap),
          rokuyoOf(d.year, d.month, d.day)!,
        );
    }
    for (const [key, name] of first) {
      const month = Math.floor(key / 2);
      expect(name, `month ${month}`).toBe(names[(month + 1) % 6]);
    }
    expect(first.size).toBe(12);
  });

  it("gives the leap month the same days as the month that it repeats", () => {
    const leap = toKyureki(2025, 7, 25)!;
    expect(leap).toMatchObject({ month: 6, day: 1, leap: true });
    expect(rokuyoOf(2025, 7, 25)).toBe("赤口");
  });

  it("returns null outside the supported years", () => {
    expect(rokuyoOf(1949, 12, 31)).toBeNull();
    expect(rokuyoOf(2151, 1, 1)).toBeNull();
  });
});
