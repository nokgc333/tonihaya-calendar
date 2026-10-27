// @vitest-environment happy-dom
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonthDetail } from "@/components/month/MonthDetail";
import { makeEvent, renderInApp } from "../../../tests/support/calendarHarness";

const countdowns = {
  toSaturday: 3,
  toMonthEnd: 16,
  remainingBusinessDays: 12,
  toYearEnd: 169,
};

const base = {
  year: 2026,
  month: 7,
  today: { year: 2026, month: 7, day: 15 },
  countdowns,
  weekStart: "sun" as const,
  jumpPivot: null,
};

const show = (over: Partial<Parameters<typeof MonthDetail>[0]> = {}) => {
  const h = {
    onBack: vi.fn(),
    onMonthChange: vi.fn(),
    onDayClick: vi.fn(),
    onJump: vi.fn(),
    onWeekStartChange: vi.fn(),
  };
  return {
    h,
    view: renderInApp(<MonthDetail {...base} {...h} {...over} />, [
      makeEvent("Review", [2026, 7, 15], [2026, 7, 15]),
    ]),
  };
};

describe("MonthDetail", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the month, its counts and its holidays", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月")).toBeInTheDocument();
    expect(screen.getByText("海の日")).toBeInTheDocument();
    expect(screen.getByText("7/20")).toBeInTheDocument();
    expect(screen.getByText("(月)")).toBeInTheDocument();
  });

  it("says there is no holiday in a month without one", async () => {
    await show({ month: 6, today: null }).view;
    expect(screen.getByText("祝日なし")).toBeInTheDocument();
  });

  it("moves to the neighboring months, wrapping over the year", async () => {
    const jan = show({ month: 1, today: null });
    await jan.view;
    fireEvent.click(screen.getByLabelText("前の月"));
    expect(jan.h.onMonthChange).toHaveBeenCalledWith(2025, 12);
    cleanup();
    const dec = show({ month: 12, today: null });
    await dec.view;
    fireEvent.click(screen.getByLabelText("次の月"));
    expect(dec.h.onMonthChange).toHaveBeenCalledWith(2027, 1);
  });

  it("goes back on Escape and on the back button", async () => {
    const { h, view } = show();
    await view;
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByLabelText("俯瞰に戻る（Escでも戻れます）"));
    expect(h.onBack).toHaveBeenCalledTimes(2);
  });

  it("opens the day that is clicked in the month grid", async () => {
    const { h, view } = show();
    const { container } = await view;
    const cell = [
      ...container.querySelectorAll<HTMLElement>("[class*='cursor-pointer']"),
    ].find((e) => e.textContent?.startsWith("20"))!;
    fireEvent.click(cell);
    expect(h.onDayClick).toHaveBeenCalledWith(2026, 7, 20);
  });

  it("shows the countdown chips only when there are countdowns", async () => {
    await show().view;
    expect(screen.getAllByText("月末まで").length).toBeGreaterThan(0);
    cleanup();
    await show({ countdowns: null }).view;
    expect(screen.queryByText("月末まで")).not.toBeInTheDocument();
  });

  it("names the card transition after the month, unless a jump is under way", async () => {
    const normal = await show().view;
    expect(normal.container.querySelector("[style*='month-7']")).not.toBeNull();
    cleanup();
    const jumped = await show({ jumpPivot: { year: 2026, month: 7, day: 15 } })
      .view;
    expect(jumped.container.querySelector("[style*='month-7']")).toBeNull();
  });
});
