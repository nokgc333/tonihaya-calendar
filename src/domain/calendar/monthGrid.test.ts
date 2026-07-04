import { describe, expect, test } from "vitest";
import { getMonthGrid } from "./grid";
import type { CalendarDay } from "./types";

const flat = (weeks: readonly (readonly CalendarDay[])[]): CalendarDay[] =>
  weeks.flatMap((w) => [...w]);

describe("getMonthGrid", () => {
  test("週数に依らず常に6週を返す（カード高さ固定・空行を作らないため）", () => {
    // 2026-02 は自然には4週だが、6週ぶんを翌月の日で埋めて返す
    expect(getMonthGrid(2026, 2, "sun")).toHaveLength(6);
    // 自然に5週の月も6週に揃える
    expect(getMonthGrid(2024, 1, "sun")).toHaveLength(6);
  });

  test("各週はちょうど7日で構成される", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
  });

  test("対象月の全日が inMonth=true で含まれる", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const inMonthDays = flat(grid).filter((d) => d.inMonth);
    expect(inMonthDays).toHaveLength(31);
    expect(inMonthDays.map((d) => d.day)).toEqual(
      Array.from({ length: 31 }, (_, i) => i + 1),
    );
  });

  test("2024-01-01 は月曜(weekday=1)で inMonth=true", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const first = flat(grid).find((d) => d.inMonth && d.day === 1)!;
    expect(first.weekday).toBe(1);
    expect(first.year).toBe(2024);
    expect(first.month).toBe(1);
  });

  test("週開始=日曜: 先頭セルは前月末の埋め日(2023-12-31 日曜)", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const head = grid[0][0];
    expect(head.inMonth).toBe(false);
    expect(head.year).toBe(2023);
    expect(head.month).toBe(12);
    expect(head.day).toBe(31);
    expect(head.weekday).toBe(0);
  });

  test("週開始=月曜: 2024-01-01(月)がそのまま先頭に来る", () => {
    const grid = getMonthGrid(2024, 1, "mon");
    const head = grid[0][0];
    expect(head.inMonth).toBe(true);
    expect(head.day).toBe(1);
    expect(head.weekday).toBe(1);
  });

  test("末尾は翌月の埋め日で、グリッド全体は7の倍数", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const all = flat(grid);
    expect(all.length % 7).toBe(0);
    const tail = all[all.length - 1];
    expect(tail.inMonth).toBe(false);
    expect(tail.month).toBe(2);
  });
});
