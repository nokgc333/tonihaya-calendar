// @vitest-environment happy-dom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollToNow } from "@/components/timeline/useScrollToNow";
import { HOUR_HEIGHT } from "@/components/timeline/timelineLayout";

const date = { year: 2026, month: 7, day: 15 };

describe("useScrollToNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => vi.useRealTimers());

  const scrollTopFor = (todayIndex: number): number => {
    const el = document.createElement("div");
    renderHook(() => useScrollToNow({ current: el }, todayIndex, date));
    return el.scrollTop;
  };

  it("scrolls two hours above the current time when today is shown", () => {
    expect(scrollTopFor(0)).toBe(11.5 * HOUR_HEIGHT);
  });

  it("leaves the scroll position when today is not shown", () => {
    expect(scrollTopFor(-1)).toBe(0);
  });
});
