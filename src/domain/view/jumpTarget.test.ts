import { describe, expect, test } from "vitest";
import { resolveJumpTarget } from "./jumpTarget";
import type { ZoomState } from "./zoom";

const TODAY = { year: 2026, month: 7, day: 5 };

describe("resolveJumpTarget", () => {
  test("overviewへ: yearのみ保持", () => {
    const zoom: ZoomState = { level: "day", year: 2030, month: 3, day: 15 };
    expect(resolveJumpTarget("overview", zoom, TODAY)).toEqual({ level: "overview", year: 2030 });
  });

  test("L0(年のみ)からdayへ: month/dayをtodayで補完", () => {
    const zoom: ZoomState = { level: "overview", year: 2026 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day", year: 2026, month: 7, day: 5,
    });
  });

  test("L1(月あり)からdayへ: monthは保持しdayはtodayで補完", () => {
    const zoom: ZoomState = { level: "month", year: 2026, month: 3 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day", year: 2026, month: 3, day: 5,
    });
  });

  test("monthへ: dayは落とす", () => {
    const zoom: ZoomState = { level: "week", year: 2026, month: 8, day: 20 };
    expect(resolveJumpTarget("month", zoom, TODAY)).toEqual({ level: "month", year: 2026, month: 8 });
  });

  test("weekへ: 文脈のday保持", () => {
    const zoom: ZoomState = { level: "day", year: 2026, month: 8, day: 20 };
    expect(resolveJumpTarget("week", zoom, TODAY)).toEqual({
      level: "week", year: 2026, month: 8, day: 20,
    });
  });

  test("日のクランプ: today.day=31 で2月なら28に丸める", () => {
    const zoom: ZoomState = { level: "month", year: 2026, month: 2 };
    const t = { year: 2026, month: 12, day: 31 };
    expect(resolveJumpTarget("day", zoom, t)).toEqual({
      level: "day", year: 2026, month: 2, day: 28,
    });
  });

  test("zoom.dayのクランプ: 文脈dayが対象月の日数を超えたら丸める (2/31→2/28)", () => {
    const zoom: ZoomState = { level: "week", year: 2026, month: 2, day: 31 };
    expect(resolveJumpTarget("day", zoom, TODAY)).toEqual({
      level: "day", year: 2026, month: 2, day: 28,
    });
  });

  test("zoom.dayのクランプ: うるう年は29に丸める (2/31→2/29)", () => {
    const zoom: ZoomState = { level: "week", year: 2024, month: 2, day: 31 };
    expect(resolveJumpTarget("week", zoom, TODAY)).toEqual({
      level: "week", year: 2024, month: 2, day: 29,
    });
  });

  test("today=null: month=1, day=1 にフォールバック", () => {
    const zoom: ZoomState = { level: "overview", year: 2026 };
    expect(resolveJumpTarget("day", zoom, null)).toEqual({
      level: "day", year: 2026, month: 1, day: 1,
    });
  });
});
