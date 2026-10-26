// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverviewBody } from "@/components/OverviewBody";
import { renderInApp } from "../../tests/support/calendarHarness";

const base = {
  year: 2026,
  today: { year: 2026, month: 7, day: 15 },
  layout: "3x4" as const,
  weekStart: "sun" as const,
  jumpPivot: null,
};

const show = (over: Partial<Parameters<typeof OverviewBody>[0]> = {}) => {
  const h = {
    onYearChange: vi.fn(),
    onMonthClick: vi.fn(),
    onLayoutChange: vi.fn(),
    onJump: vi.fn(),
    onWeekStartChange: vi.fn(),
  };
  return { h, view: renderInApp(<OverviewBody {...base} {...h} {...over} />) };
};

describe("OverviewBody", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15, 13, 30));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the twelve months of the year", async () => {
    await show().view;
    expect(screen.getAllByRole("group", { name: /^\d+月$/ })).toHaveLength(12);
  });

  it("opens the month that is clicked", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getAllByRole("group", { name: /^\d+月$/ })[8]);
    expect(h.onMonthClick).toHaveBeenCalledWith(9);
  });

  it("switches the layout with the two layout buttons", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByRole("button", { name: "4×3" }));
    fireEvent.click(screen.getByRole("button", { name: "3×4" }));
    expect(h.onLayoutChange.mock.calls).toEqual([["4x3"], ["3x4"]]);
  });

  it("marks the active layout as pressed", async () => {
    await show({ layout: "4x3" }).view;
    expect(screen.getByRole("button", { name: "4×3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "3×4" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("returns to this year from another year", async () => {
    const { h, view } = show({ year: 2030 });
    await view;
    fireEvent.click(screen.getByRole("button", { name: "今年" }));
    expect(h.onYearChange).toHaveBeenCalledWith(2026);
  });

  it("shows the holiday list of the year in the side column", async () => {
    const { container } = await show().view;
    const aside = container.querySelector("aside")!;
    expect(within(aside).getByText("元日")).toBeInTheDocument();
  });

  it("switches the level with the level switcher", async () => {
    const { h, view } = show();
    await view;
    fireEvent.click(screen.getByRole("button", { name: "週" }));
    expect(h.onJump).toHaveBeenCalledWith("week");
  });

  it("leaves the month transition names off while a jump is under way", async () => {
    const jumped = await show({ jumpPivot: { year: 2026, month: 7, day: 15 } })
      .view;
    expect(jumped.container.querySelector("[style*='month-3']")).toBeNull();
    cleanup();
    const normal = await show().view;
    expect(normal.container.querySelector("[style*='month-3']")).not.toBeNull();
  });
});
