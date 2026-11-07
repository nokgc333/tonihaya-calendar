// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useCalendarPivots } from "@/hooks/useCalendarPivots";
import type { ZoomState } from "@/domain/view";

afterEach(cleanup);

const day = { year: 2026, month: 7, day: 15 };
const overview: ZoomState = { level: "overview", year: 2026 };
const week: ZoomState = { level: "week", year: 2026, month: 7, day: 15 };

const setup = (initial: ZoomState) =>
  renderHook(({ zoom }) => useCalendarPivots(zoom), {
    initialProps: { zoom: initial },
  });

describe("useCalendarPivots", () => {
  it("starts without any pivot", () => {
    const { result } = setup(overview);
    expect(result.current.pivotDay).toBeNull();
    expect(result.current.jumpPivot).toBeNull();
    expect(result.current.dayPivot).toBeNull();
    expect(result.current.weekOrigin).toBeNull();
  });

  it("drops the jump pivot when the zoom changes", () => {
    const { result, rerender } = setup(overview);
    act(() => result.current.setJumpPivot(day));
    expect(result.current.jumpPivot).toEqual(day);
    rerender({ zoom: week });
    expect(result.current.jumpPivot).toBeNull();
  });

  it("keeps the jump pivot for the one zoom change that the jump itself caused", () => {
    const { result, rerender } = setup(overview);
    act(() => {
      result.current.setJumpPivot(day);
      result.current.justJumpedRef.current = true;
    });
    rerender({ zoom: week });
    expect(result.current.jumpPivot).toEqual(day);
    expect(result.current.justJumpedRef.current).toBe(false);
    rerender({ zoom: { ...week, day: 16 } });
    expect(result.current.jumpPivot).toBeNull();
  });

  it("keeps the day pivot while on the week or the day and drops it elsewhere", () => {
    const { result, rerender } = setup(week);
    act(() => result.current.setDayPivot(day));
    rerender({ zoom: { level: "day", year: 2026, month: 7, day: 15 } });
    expect(result.current.dayPivot).toEqual(day);
    rerender({ zoom: { level: "month", year: 2026, month: 7 } });
    expect(result.current.dayPivot).toBeNull();
  });

  it("remembers the month a week was opened from", () => {
    const { result } = setup(week);
    act(() => result.current.setWeekOrigin({ year: 2026, month: 8 }));
    expect(result.current.weekOrigin).toEqual({ year: 2026, month: 8 });
  });
});
