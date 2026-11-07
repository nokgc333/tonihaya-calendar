import { describe, expect, test } from "vitest";
import { getMonthGrid } from "./grid";
import type { CalendarDay } from "./types";

const flat = (weeks: readonly (readonly CalendarDay[])[]): CalendarDay[] =>
  weeks.flatMap((w) => [...w]);

describe("getMonthGrid", () => {
  test("always returns 6 weeks regardless of the week count (fixed card height, no empty rows)", () => {
    expect(getMonthGrid(2026, 2, "sun")).toHaveLength(6);
    expect(getMonthGrid(2024, 1, "sun")).toHaveLength(6);
  });

  test("each week consists of exactly 7 days", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
  });

  test("includes every day of the target month with inMonth=true", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const inMonthDays = flat(grid).filter((d) => d.inMonth);
    expect(inMonthDays).toHaveLength(31);
    expect(inMonthDays.map((d) => d.day)).toEqual(
      Array.from({ length: 31 }, (_, i) => i + 1),
    );
  });

  test("2024-01-01 is a Monday (weekday=1) with inMonth=true", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const first = flat(grid).find((d) => d.inMonth && d.day === 1)!;
    expect(first.weekday).toBe(1);
    expect(first.year).toBe(2024);
    expect(first.month).toBe(1);
  });

  test("week starts on Sunday: the first cell is a filler day from the previous month (2023-12-31, Sunday)", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const head = grid[0][0];
    expect(head.inMonth).toBe(false);
    expect(head.year).toBe(2023);
    expect(head.month).toBe(12);
    expect(head.day).toBe(31);
    expect(head.weekday).toBe(0);
  });

  test("week starts on Monday: 2024-01-01 (Monday) is the first cell", () => {
    const grid = getMonthGrid(2024, 1, "mon");
    const head = grid[0][0];
    expect(head.inMonth).toBe(true);
    expect(head.day).toBe(1);
    expect(head.weekday).toBe(1);
  });

  test("the tail is filled with next-month days and the whole grid is a multiple of 7", () => {
    const grid = getMonthGrid(2024, 1, "sun");
    const all = flat(grid);
    expect(all.length % 7).toBe(0);
    const tail = all[all.length - 1];
    expect(tail.inMonth).toBe(false);
    expect(tail.month).toBe(2);
  });
});
