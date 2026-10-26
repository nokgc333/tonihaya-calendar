// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DayView } from "@/components/DayView";
import { makeEvent, renderInApp } from "../../tests/support/calendarHarness";
import type { CalendarEvent } from "@/domain/event";

const base = {
  year: 2026,
  month: 7,
  day: 15,
  today: { year: 2026, month: 7, day: 15 },
  weekStart: "sun" as const,
  jumpPivot: null,
};

const show = (
  over: Partial<Parameters<typeof DayView>[0]> = {},
  events: CalendarEvent[] = [],
) => {
  const h = {
    onBack: vi.fn(),
    onDayChange: vi.fn(),
    onJump: vi.fn(),
    onWeekStartChange: vi.fn(),
  };
  return {
    h,
    view: renderInApp(<DayView {...base} {...h} {...over} />, events),
  };
};

describe("DayView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the date with its weekday in the navigation and in the heading", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月15日 水曜日")).toBeInTheDocument();
    expect(screen.getByText("2026年7月15日（水）")).toBeInTheDocument();
  });

  it("moves one day back and forward across month and year edges", async () => {
    const { h, view } = show({ month: 12, day: 31 });
    await view;
    fireEvent.click(screen.getByLabelText("前の日"));
    fireEvent.click(screen.getByLabelText("次の日"));
    expect(h.onDayChange.mock.calls).toEqual([
      [2026, 12, 30],
      [2027, 1, 1],
    ]);
  });

  it("goes back on Escape and on the back button", async () => {
    const { h, view } = show();
    await view;
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByLabelText("週に戻る（Escでも戻れます）"));
    expect(h.onBack).toHaveBeenCalledTimes(2);
  });

  it("draws the current time line and scrolls to it only on today", async () => {
    const today = await show().view;
    expect(today.container.querySelector("[class*='z-[6]']")).not.toBeNull();
    expect(
      (today.container.querySelector(".overflow-y-auto") as HTMLElement)
        .scrollTop,
    ).toBe(11.5 * 48);
    cleanup();
    const other = await show({ day: 16 }).view;
    expect(other.container.querySelector("[class*='z-[6]']")).toBeNull();
    expect(
      (other.container.querySelector(".overflow-y-auto") as HTMLElement)
        .scrollTop,
    ).toBe(0);
  });

  it("shows the holiday name and the all-day events of the day only", async () => {
    const events = [
      makeEvent("Same day", [2026, 7, 20], [2026, 7, 20]),
      makeEvent("Other day", [2026, 7, 21], [2026, 7, 21]),
    ];
    await show({ day: 20, today: null }, events).view;
    expect(screen.getByText("海の日")).toBeInTheDocument();
    expect(screen.getByTitle("Same day")).toBeInTheDocument();
    expect(screen.queryByTitle("Other day")).not.toBeInTheDocument();
  });

  it("opens the editor from an all-day event and from a timed event", async () => {
    const events = [
      makeEvent("Holiday trip", [2026, 7, 15], [2026, 7, 15]),
      makeEvent("Meeting", [2026, 7, 15, 9], [2026, 7, 15, 10]),
    ];
    await show({}, events).view;
    await act(async () => {
      fireEvent.click(screen.getByTitle("Holiday trip"));
    });
    expect(
      screen.getByRole("dialog", { name: "予定を編集" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Meeting を編集"));
    });
    expect(
      screen.getByRole("dialog", { name: "予定を編集" }),
    ).toBeInTheDocument();
  });

  it("names the heading transition hour-zoom, or the frame jump-zoom after a jump", async () => {
    const normal = await show().view;
    expect(
      normal.container.querySelector("[style*='hour-zoom']"),
    ).not.toBeNull();
    expect(normal.container.querySelector("[style*='jump-zoom']")).toBeNull();
    cleanup();
    const jumped = await show({ jumpPivot: { year: 2026, month: 7, day: 15 } })
      .view;
    expect(jumped.container.querySelector("[style*='hour-zoom']")).toBeNull();
    expect(
      jumped.container.querySelector("[style*='jump-zoom']"),
    ).not.toBeNull();
  });
});
