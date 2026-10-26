// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalendarNavigation } from "@/hooks/calendarNavigation";
import { useCalendarPivots } from "@/hooks/useCalendarPivots";
import type { ZoomState } from "@/domain/view";

afterEach(cleanup);

const today = { year: 2026, month: 7, day: 15 };

const setup = (zoom: ZoomState) => {
  const navigate = vi.fn();
  const hook = renderHook(
    ({ z }) => {
      const pivots = useCalendarPivots(z);
      return {
        pivots,
        nav: createCalendarNavigation(z, today, navigate, pivots),
      };
    },
    { initialProps: { z: zoom } },
  );
  return { navigate, hook };
};

describe("createCalendarNavigation", () => {
  it("jumps far with the jump pivot on the anchor day and a push", () => {
    const { navigate, hook } = setup({ level: "overview", year: 2026 });
    act(() => hook.result.current.nav.onJump("day"));
    expect(hook.result.current.pivots.jumpPivot).toEqual(today);
    expect(navigate).toHaveBeenCalledWith(
      { level: "day", year: 2026, month: 7, day: 15 },
      "push",
    );
  });

  it("jumps between week and day with the day pivot", () => {
    const { navigate, hook } = setup({
      level: "week",
      year: 2026,
      month: 7,
      day: 15,
    });
    act(() => hook.result.current.nav.onJump("day"));
    expect(hook.result.current.pivots.dayPivot).toEqual(today);
    expect(hook.result.current.pivots.jumpPivot).toBeNull();
    expect(navigate.mock.calls[0][1]).toBe("push");
  });

  it("jumps between month and week with the pivot day", () => {
    const { hook } = setup({ level: "month", year: 2026, month: 7 });
    act(() => hook.result.current.nav.onJump("week"));
    expect(hook.result.current.pivots.pivotDay).toEqual(today);
  });

  it("opens a day of the month as a week and remembers the month", () => {
    const { navigate, hook } = setup({ level: "month", year: 2026, month: 8 });
    act(() => hook.result.current.nav.month.onDayClick(2026, 8, 31));
    expect(hook.result.current.pivots.weekOrigin).toEqual({
      year: 2026,
      month: 8,
    });
    expect(hook.result.current.pivots.pivotDay).toEqual({
      year: 2026,
      month: 8,
      day: 31,
    });
    expect(navigate).toHaveBeenCalledWith(
      { level: "week", year: 2026, month: 8, day: 31 },
      "push",
    );
  });

  it("clamps the year of a day it opens", () => {
    const { navigate, hook } = setup({ level: "month", year: 2150, month: 12 });
    act(() => hook.result.current.nav.month.onDayClick(2200, 1, 1));
    expect(navigate.mock.calls[0][0].year).toBe(2150);
  });

  it("goes from the month back to the overview of the same year and clears the pivots", () => {
    const { navigate, hook } = setup({ level: "month", year: 2026, month: 7 });
    act(() => hook.result.current.pivots.setPivotDay(today));
    act(() => hook.result.current.nav.month.onBack());
    expect(hook.result.current.pivots.pivotDay).toBeNull();
    expect(navigate).toHaveBeenCalledWith(
      { level: "overview", year: 2026 },
      "push",
    );
  });

  it("replaces the history when the month, the week, the day or the year is stepped", () => {
    const { navigate, hook } = setup({
      level: "week",
      year: 2026,
      month: 7,
      day: 15,
    });
    act(() => hook.result.current.nav.month.onMonthChange(2026, 8));
    act(() => hook.result.current.nav.week.onWeekChange(2026, 7, 22));
    act(() => hook.result.current.nav.day.onDayChange(2026, 7, 16));
    act(() => hook.result.current.nav.overview.onYearChange(2027));
    expect(navigate.mock.calls.map((c) => c[1])).toEqual([
      "replace",
      "replace",
      "replace",
      "replace",
    ]);
  });

  it("pushes the history when a level is entered", () => {
    const { navigate, hook } = setup({ level: "overview", year: 2026 });
    act(() => hook.result.current.nav.overview.onMonthClick(3));
    act(() => hook.result.current.nav.week.onDayOpen(2026, 7, 15));
    act(() => hook.result.current.nav.day.onBack());
    expect(navigate.mock.calls.map((c) => c[1])).toEqual([
      "push",
      "push",
      "push",
    ]);
  });

  it("goes from the day back to the week of the same day", () => {
    const { navigate, hook } = setup({
      level: "day",
      year: 2026,
      month: 7,
      day: 31,
    });
    act(() => hook.result.current.nav.day.onBack());
    expect(navigate).toHaveBeenCalledWith(
      { level: "week", year: 2026, month: 7, day: 31 },
      "push",
    );
  });

  it("clears the day pivot when the week goes back to the month", () => {
    const { navigate, hook } = setup({
      level: "week",
      year: 2026,
      month: 7,
      day: 15,
    });
    act(() => hook.result.current.pivots.setDayPivot(today));
    act(() => hook.result.current.nav.week.onBack());
    expect(hook.result.current.pivots.dayPivot).toBeNull();
    expect(navigate).toHaveBeenCalledWith(
      { level: "month", year: 2026, month: 7 },
      "push",
    );
  });
});
