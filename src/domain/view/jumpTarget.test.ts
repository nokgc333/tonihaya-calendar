import { describe, expect, test } from "vitest";
import { resolveJumpTarget } from "./jumpTarget";
import type { ZoomState } from "./zoom";

const TODAY = { year: 2026, month: 7, day: 5 };

describe("resolveJumpTarget", () => {
  test("to overview: keeps only the year", () => {
    const zoom: ZoomState = { level: "day", year: 2030, month: 3, day: 15 };
    expect(resolveJumpTarget("overview", zoom, TODAY)).toEqual({
      level: "overview",
      year: 2030,
    });
  });

  test("from L0 (year only) to day: fills month and day from today", () => {
    const zoom: ZoomState = { level: "overview", year: 2026 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day",
      year: 2026,
      month: 7,
      day: 5,
    });
  });

  test("from L1 (month set) to day: keeps the month and fills the day from today", () => {
    const zoom: ZoomState = { level: "month", year: 2026, month: 3 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day",
      year: 2026,
      month: 3,
      day: 5,
    });
  });

  test("to month: drops the day", () => {
    const zoom: ZoomState = { level: "week", year: 2026, month: 8, day: 20 };
    expect(resolveJumpTarget("month", zoom, TODAY)).toEqual({
      level: "month",
      year: 2026,
      month: 8,
    });
  });

  test("to week: keeps the day from the context", () => {
    const zoom: ZoomState = { level: "day", year: 2026, month: 8, day: 20 };
    expect(resolveJumpTarget("week", zoom, TODAY)).toEqual({
      level: "week",
      year: 2026,
      month: 8,
      day: 20,
    });
  });

  test("day clamp: today.day=31 in February is rounded down to 28", () => {
    const zoom: ZoomState = { level: "month", year: 2026, month: 2 };
    const t = { year: 2026, month: 12, day: 31 };
    expect(resolveJumpTarget("day", zoom, t)).toEqual({
      level: "day",
      year: 2026,
      month: 2,
      day: 28,
    });
  });

  test("zoom.day clamp: a context day over the month length is rounded down (2/31 to 2/28)", () => {
    const zoom: ZoomState = { level: "week", year: 2026, month: 2, day: 31 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day",
      year: 2026,
      month: 2,
      day: 28,
    });
  });

  test("zoom.day clamp: a leap year is rounded to 29 (2/31 to 2/29)", () => {
    const zoom: ZoomState = { level: "week", year: 2024, month: 2, day: 31 };
    expect(resolveJumpTarget("week", zoom, TODAY)).toEqual({
      level: "week",
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  test("today=null: falls back to month=1, day=1", () => {
    const zoom: ZoomState = { level: "overview", year: 2026 };
    expect(resolveJumpTarget("day", zoom, null)).toEqual({
      level: "day",
      year: 2026,
      month: 1,
      day: 1,
    });
  });
});
