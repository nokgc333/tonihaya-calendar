// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeekView } from "@/components/WeekView";
import { makeEvent, renderInApp } from "../../tests/support/calendarHarness";
import type { CalendarEvent } from "@/domain/event";

const handlers = () => ({
  onBack: vi.fn(),
  onWeekChange: vi.fn(),
  onDayOpen: vi.fn(),
  onJump: vi.fn(),
  onWeekStartChange: vi.fn(),
});

const base = {
  year: 2026,
  month: 7,
  day: 15,
  today: { year: 2026, month: 7, day: 15 },
  dayPivot: null,
  pivotDay: null,
  jumpPivot: null,
  weekStart: "sun" as const,
};

const show = (
  over: Partial<Parameters<typeof WeekView>[0]> = {},
  events: CalendarEvent[] = [],
) => {
  const h = handlers();
  const view = renderInApp(<WeekView {...base} {...h} {...over} />, events);
  return { h, view };
};

describe("WeekView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the range of the week, with the year only once inside a year", async () => {
    await show().view;
    expect(screen.getByText("2026年 7月12日 〜 7月18日")).toBeInTheDocument();
  });

  it("shows the year on both ends when the week crosses years", async () => {
    await show({ month: 12, day: 31, today: null }).view;
    expect(
      screen.getByText("2026年 12月27日 〜 2027年 1月2日"),
    ).toBeInTheDocument();
  });

  it("starts the week on Monday when asked to", async () => {
    await show({ weekStart: "mon" }).view;
    expect(screen.getByText("2026年 7月13日 〜 7月19日")).toBeInTheDocument();
  });

  it("moves one week back and forward", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByLabelText("前の週"));
    fireEvent.click(screen.getByLabelText("次の週"));
    expect(h.onWeekChange.mock.calls).toEqual([
      [2026, 7, 8],
      [2026, 7, 22],
    ]);
  });

  it("goes back on Escape and on the back button", async () => {
    const { h, view } = show();
    await view;
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByLabelText("月に戻る（Escでも戻れます）"));
    expect(h.onBack).toHaveBeenCalledTimes(2);
  });

  it("opens a day from its header and from an hour cell", async () => {
    const { h, view } = show();
    const { container } = await view;
    fireEvent.click(screen.getByLabelText("7月16日を開く"));
    fireEvent.click(container.querySelector("button[aria-hidden='true']")!);
    expect(h.onDayOpen.mock.calls).toEqual([
      [2026, 7, 16],
      [2026, 7, 12],
    ]);
  });

  it("marks today and draws the current time line only when today is in the week", async () => {
    const withToday = await show().view;
    expect(
      withToday.container.querySelector("[aria-current='date']"),
    ).not.toBeNull();
    expect(
      withToday.container.querySelector("[class*='z-[6]']"),
    ).not.toBeNull();
    cleanup();
    const without = await show({ today: null }).view;
    expect(without.container.querySelector("[aria-current='date']")).toBeNull();
    expect(without.container.querySelector("[class*='z-[6]']")).toBeNull();
  });

  it("scrolls the hours to just before the current time on today's week", async () => {
    const { container } = await show().view;
    const body = container.querySelector(".overflow-y-auto") as HTMLElement;
    expect(body.scrollTop).toBe(11.5 * 48);
  });

  it("shows the holiday name in the all-day row", async () => {
    await show({ day: 20, today: null }).view;
    expect(screen.getByText("海の日")).toBeInTheDocument();
  });

  it("shows all-day and timed events and opens the editor from them", async () => {
    const events = [
      makeEvent("Trip", [2026, 7, 14], [2026, 7, 16]),
      makeEvent("Standup", [2026, 7, 15, 9], [2026, 7, 15, 10]),
    ];
    await show({}, events).view;
    fireEvent.click(screen.getAllByTitle("Trip")[0]);
    expect(
      await screen.findByRole("dialog", { name: "予定を編集" }),
    ).toBeInTheDocument();
    cleanup();
    await show({}, events).view;
    expect(screen.getByLabelText("Standup を編集")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Standup を編集"));
    });
    expect(
      screen.getByRole("dialog", { name: "予定を編集" }),
    ).toBeInTheDocument();
  });

  it("names the view transitions of the day zoom, the picked day and the jump", async () => {
    const zoom = await show({ pivotDay: { year: 2026, month: 7, day: 15 } })
      .view;
    expect(zoom.container.querySelector("[style*='day-zoom']")).not.toBeNull();
    cleanup();
    const picked = await show({ dayPivot: { year: 2026, month: 7, day: 16 } })
      .view;
    expect(
      screen.getByLabelText("7月16日を開く").style.viewTransitionName,
    ).toBe("hour-zoom");
    expect(picked.container.querySelector("[style*='day-zoom']")).toBeNull();
    cleanup();
    await show({ jumpPivot: { year: 2026, month: 7, day: 17 } }).view;
    expect(
      screen.getByLabelText("7月17日を開く").style.viewTransitionName,
    ).toBe("jump-zoom");
  });
});
